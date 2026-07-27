import { Types } from 'mongoose';
import { ActivityLog } from '../activityLog/activityLog.model.js';
import { Category } from '../category/category.model.js';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../order/order.constant.js';
import { Order } from '../order/order.model.js';
import { PaymentLog } from '../paymentLog/paymentLog.model.js';
import { Product } from '../product/product.model.js';
import { Review } from '../review/review.model.js';
import { User } from '../user/user.model.js';
import type { IAdminAnalytics, IAdminAnalyticsFilters } from './analytics.interface.js';

const VALID_ORDER_STATUSES = new Set(Object.keys(ORDER_STATUS));
const VALID_PAYMENT_STATUSES = new Set(Object.keys(PAYMENT_STATUS));
const VALID_PAYMENT_METHODS = new Set(Object.keys(PAYMENT_METHOD));
const VALID_COURIER_PROVIDERS = new Set(['steadfast']);

const parseFilters = (query: Record<string, unknown>): IAdminAnalyticsFilters => {
  const filters: IAdminAnalyticsFilters = {};
  const dateFrom = typeof query.dateFrom === 'string' ? query.dateFrom.trim() : '';
  const dateTo = typeof query.dateTo === 'string' ? query.dateTo.trim() : '';
  const category = typeof query.category === 'string' ? query.category.trim() : '';
  const orderStatus = typeof query.orderStatus === 'string' ? query.orderStatus.trim() : '';
  const paymentStatus = typeof query.paymentStatus === 'string' ? query.paymentStatus.trim() : '';
  const paymentMethod = typeof query.paymentMethod === 'string' ? query.paymentMethod.trim() : '';
  const courierProvider = typeof query.courierProvider === 'string' ? query.courierProvider.trim() : '';

  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;
  if (Types.ObjectId.isValid(category)) filters.category = category;
  if (VALID_ORDER_STATUSES.has(orderStatus)) {
    filters.orderStatus = orderStatus as NonNullable<
      IAdminAnalyticsFilters['orderStatus']
    >;
  }
  if (VALID_PAYMENT_STATUSES.has(paymentStatus)) {
    filters.paymentStatus = paymentStatus as NonNullable<
      IAdminAnalyticsFilters['paymentStatus']
    >;
  }
  if (VALID_PAYMENT_METHODS.has(paymentMethod)) {
    filters.paymentMethod = paymentMethod as NonNullable<
      IAdminAnalyticsFilters['paymentMethod']
    >;
  }
  if (VALID_COURIER_PROVIDERS.has(courierProvider)) {
    filters.courierProvider = courierProvider as NonNullable<
      IAdminAnalyticsFilters['courierProvider']
    >;
  }

  return filters;
};

const buildDateRange = (filters: IAdminAnalyticsFilters) => {
  const range: Record<string, Date> = {};

  if (filters.dateFrom) {
    const dateFrom = new Date(filters.dateFrom);

    if (!Number.isNaN(dateFrom.getTime())) {
      dateFrom.setHours(0, 0, 0, 0);
      range.$gte = dateFrom;
    }
  }

  if (filters.dateTo) {
    const dateTo = new Date(filters.dateTo);

    if (!Number.isNaN(dateTo.getTime())) {
      dateTo.setHours(23, 59, 59, 999);
      range.$lte = dateTo;
    }
  }

  return range;
};

const buildOrderMatch = async (filters: IAdminAnalyticsFilters) => {
  const match: Record<string, unknown> = { isDeleted: false };
  const createdAt = buildDateRange(filters);

  if (Object.keys(createdAt).length) match.createdAt = createdAt;
  if (filters.orderStatus) match.orderStatus = filters.orderStatus;
  if (filters.paymentStatus) match.paymentStatus = filters.paymentStatus;
  if (filters.paymentMethod) match.paymentMethod = filters.paymentMethod;
  if (filters.courierProvider) match.courierProvider = filters.courierProvider;

  if (filters.category) {
    const productIds = await Product.find({
      category: filters.category,
      isDeleted: false,
    }).distinct('_id');

    match['items.product'] = { $in: productIds };
  }

  return match;
};

const buildCreatedAtMatch = (filters: IAdminAnalyticsFilters) => {
  const createdAt = buildDateRange(filters);

  return Object.keys(createdAt).length ? { createdAt } : {};
};

const toNamedCounts = (rows: Array<{ _id?: string; count: number }>) =>
  rows.map((row) => ({
    count: row.count,
    label: row._id || 'Not set',
  }));

const getAdminAnalyticsFromDB = async (
  query: Record<string, unknown>,
): Promise<IAdminAnalytics> => {
  const filters = parseFilters(query);
  const orderMatch = await buildOrderMatch(filters);
  const createdAtMatch = buildCreatedAtMatch(filters);
  const paidOrderMatch = {
    ...orderMatch,
    paymentStatus: PAYMENT_STATUS.paid,
  };
  const nonCancelledOrderMatch = {
    ...orderMatch,
    orderStatus: { $ne: ORDER_STATUS.cancelled },
  };

  const [
    totalOrders,
    paidOrders,
    revenueAgg,
    paidRevenueAgg,
    orderStatusRows,
    paymentStatusRows,
    paymentMethodRows,
    revenueTrend,
    topProducts,
    topCategories,
    lowStock,
    outOfStock,
    slowMoving,
    totalActiveCustomers,
    newCustomers,
    repeatCustomerAgg,
    customerRows,
    customerTrend,
    reviewAgg,
    ratingRows,
    negativeReviews,
    hiddenReviews,
    courierStatusRows,
    shipmentsCreated,
    shipped,
    delivered,
    syncWarnings,
    adminActions,
    failedLogins,
    warningOrFailedEvents,
    mostActiveAdmins,
    failedPaymentTrend,
  ] = await Promise.all([
    Order.countDocuments(orderMatch),
    Order.countDocuments(paidOrderMatch),
    Order.aggregate([
      { $match: nonCancelledOrderMatch },
      { $group: { _id: null, value: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: paidOrderMatch },
      { $group: { _id: null, value: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
          orders: { $sum: 1 },
          paidRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUS.paid] }, '$totalPrice', 0],
            },
          },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 60 },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          revenue: { $sum: '$items.subtotal' },
          soldQuantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { soldQuantity: -1, revenue: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, name: '$_id', revenue: 1, soldQuantity: 1 } },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      { $unwind: '$items' },
      {
        $lookup: {
          as: 'product',
          foreignField: '_id',
          from: 'products',
          localField: 'items.product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          as: 'category',
          foreignField: '_id',
          from: 'categories',
          localField: 'product.category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category.name',
          revenue: { $sum: '$items.subtotal' },
          soldQuantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { soldQuantity: -1, revenue: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, name: { $ifNull: ['$_id', 'Uncategorized'] }, revenue: 1, soldQuantity: 1 } },
    ]),
    Product.find({ isDeleted: false, stock: { $gt: 0, $lte: 5 } })
      .sort({ stock: 1, createdAt: -1 })
      .limit(8)
      .populate('category', 'name'),
    Product.countDocuments({ isDeleted: false, stock: { $lte: 0 } }),
    Product.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          as: 'sold',
          foreignField: 'items.product',
          from: 'orders',
          localField: '_id',
        },
      },
      {
        $project: {
          name: 1,
          soldQuantity: {
            $sum: {
              $map: {
                as: 'order',
                in: {
                  $sum: {
                    $map: {
                      as: 'item',
                      in: {
                        $cond: [
                          { $eq: ['$$item.product', '$_id'] },
                          '$$item.quantity',
                          0,
                        ],
                      },
                      input: '$$order.items',
                    },
                  },
                },
                input: '$sold',
              },
            },
          },
        },
      },
      { $sort: { soldQuantity: 1, name: 1 } },
      { $limit: 8 },
    ]),
    User.countDocuments({ isDeleted: false, status: 'active', role: 'user' }),
    User.countDocuments({ ...createdAtMatch, isDeleted: false, role: 'user' }),
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$user', orders: { $sum: 1 } } },
      { $match: { orders: { $gte: 2 } } },
      { $count: 'count' },
    ]),
    Order.aggregate([
      { $match: orderMatch },
      { $group: { _id: '$user', orders: { $sum: 1 }, spend: { $sum: '$totalPrice' } } },
      {
        $lookup: {
          as: 'user',
          foreignField: '_id',
          from: 'users',
          localField: '_id',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          email: '$user.email',
          name: '$user.name',
          orders: 1,
          spend: 1,
        },
      },
      { $sort: { spend: -1, orders: -1 } },
      { $limit: 8 },
    ]),
    User.aggregate([
      { $match: { ...createdAtMatch, isDeleted: false, role: 'user' } },
      {
        $group: {
          _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 60 },
    ]),
    Review.aggregate([
      { $match: { ...createdAtMatch, isDeleted: false } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]),
    Review.aggregate([
      { $match: { ...createdAtMatch, isDeleted: false } },
      { $group: { _id: { $toString: '$rating' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]),
    Review.find({ ...createdAtMatch, isDeleted: false, rating: { $lte: 2 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('product', 'name'),
    Review.countDocuments({ ...createdAtMatch, isDeleted: false, isHidden: true }),
    Order.aggregate([
      { $match: { ...orderMatch, courierStatus: { $exists: true, $ne: '' } } },
      { $group: { _id: '$courierStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Order.countDocuments({ ...orderMatch, shipmentCreatedAt: { $exists: true } }),
    Order.countDocuments({ ...orderMatch, orderStatus: ORDER_STATUS.shipped }),
    Order.countDocuments({ ...orderMatch, orderStatus: ORDER_STATUS.delivered }),
    ActivityLog.countDocuments({
      ...createdAtMatch,
      module: 'shipping',
      status: { $in: ['warning', 'failed'] },
    }),
    ActivityLog.countDocuments({ ...createdAtMatch, actorRole: 'admin' }),
    ActivityLog.countDocuments({ ...createdAtMatch, action: 'user.login_failed' }),
    ActivityLog.countDocuments({ ...createdAtMatch, status: { $in: ['warning', 'failed'] } }),
    ActivityLog.aggregate([
      { $match: { ...createdAtMatch, actorRole: 'admin' } },
      {
        $group: {
          _id: { email: '$actorEmail', name: '$actorName' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, count: 1, email: '$_id.email', name: '$_id.name' } },
    ]),
    PaymentLog.aggregate([
      { $match: { ...createdAtMatch, status: { $in: ['Failed', 'Refunded'] } } },
      {
        $group: {
          _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 60 },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.value || 0;
  const paidRevenue = paidRevenueAgg[0]?.value || 0;
  const failedOrRefundedPayments = toNamedCounts(paymentStatusRows).reduce(
    (sum, row) => (['failed', 'refunded'].includes(row.label) ? sum + row.count : sum),
    0,
  );
  const cancelledCount =
    toNamedCounts(orderStatusRows).find((row) => row.label === ORDER_STATUS.cancelled)?.count || 0;

  return {
    activity: {
      adminActions,
      failedLogins,
      mostActiveAdmins,
      warningOrFailedEvents,
    },
    appliedFilters: {
      category: filters.category || null,
      courierProvider: filters.courierProvider || null,
      dateFrom: filters.dateFrom || null,
      dateTo: filters.dateTo || null,
      orderStatus: filters.orderStatus || null,
      paymentMethod: filters.paymentMethod || null,
      paymentStatus: filters.paymentStatus || null,
    },
    customers: {
      highestSpend: customerRows,
      mostOrders: [...customerRows].sort((a, b) => b.orders - a.orders).slice(0, 8),
      newCustomers,
      repeatCustomers: repeatCustomerAgg[0]?.count || 0,
      totalActiveCustomers,
      trend: toNamedCounts(customerTrend),
    },
    kpis: {
      averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
      conversionProxy: totalOrders ? Math.round((paidOrders / totalOrders) * 100) : 0,
      failedOrRefundedPayments,
      newCustomers,
      paidRevenue,
      repeatCustomers: repeatCustomerAgg[0]?.count || 0,
      totalOrders,
      totalRevenue,
    },
    orders: {
      cancellationRate: totalOrders ? Math.round((cancelledCount / totalOrders) * 100) : 0,
      fulfillmentBacklog: await Order.countDocuments({
        ...orderMatch,
        orderStatus: { $in: [ORDER_STATUS.confirmed, ORDER_STATUS.processing] },
      }),
      statusSummary: toNamedCounts(orderStatusRows),
    },
    payments: {
      failedTrend: toNamedCounts(failedPaymentTrend),
      methodSummary: toNamedCounts(paymentMethodRows),
      statusSummary: toNamedCounts(paymentStatusRows),
      successRate: totalOrders ? Math.round((paidOrders / totalOrders) * 100) : 0,
    },
    products: {
      lowStock: lowStock.map((product) => {
        const categoryName =
          typeof product.category === 'object' &&
          product.category !== null &&
          'name' in product.category
            ? String(product.category.name)
            : undefined;

        return {
          ...(categoryName ? { category: categoryName } : {}),
          name: product.name,
          stock: product.stock,
        };
      }),
      outOfStock,
      slowMoving: slowMoving.map((product) => ({
        name: product.name,
        soldQuantity: product.soldQuantity || 0,
      })),
      topCategories,
      topProducts,
    },
    reviews: {
      averageRating: Math.round((reviewAgg[0]?.averageRating || 0) * 10) / 10,
      hiddenReviews,
      negativeReviews: negativeReviews.map((review) => {
        const productName =
          typeof review.product === 'object' &&
          review.product !== null &&
          'name' in review.product
            ? String(review.product.name)
            : undefined;
        const userName =
          typeof review.user === 'object' && review.user !== null && 'name' in review.user
            ? String(review.user.name)
            : undefined;

        return {
          ...(review.comment ? { comment: review.comment } : {}),
          ...(productName ? { product: productName } : {}),
          rating: review.rating,
          ...(userName ? { user: userName } : {}),
        };
      }),
      ratingSummary: toNamedCounts(ratingRows),
    },
    sales: {
      trend: revenueTrend.map((row) => ({
        averageOrderValue: row.orders ? Math.round(row.revenue / row.orders) : 0,
        orders: row.orders,
        paidRevenue: row.paidRevenue,
        period: row._id,
        revenue: row.revenue,
      })),
    },
    shipping: {
      courierStatusSummary: toNamedCounts(courierStatusRows),
      delivered,
      shipped,
      shipmentsCreated,
      syncWarnings,
    },
  };
};

export const AnalyticsServices = {
  getAdminAnalyticsFromDB,
};
