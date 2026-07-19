import { Types } from 'mongoose';
import { ORDER_STATUS } from '../order/order.constant.js';
import { Order } from '../order/order.model.js';
import '../category/category.model.js';
import { Product } from '../product/product.model.js';
import { Review } from '../review/review.model.js';
import { User } from '../user/user.model.js';
import { Wishlist } from '../wishlist/wishlist.model.js';
import type {
  IAdminDashboardFilters,
  IAdminDashboardStats,
  IUserDashboardStats,
} from './dashboard.interface.js';

const VALID_ORDER_STATUSES = new Set(Object.keys(ORDER_STATUS));
const VALID_PAYMENT_STATUSES = new Set([
  'unpaid',
  'paid',
  'failed',
  'refunded',
]);
type TDashboardOrderStatus = NonNullable<IAdminDashboardFilters['orderStatus']>;
type TDashboardPaymentStatus = NonNullable<
  IAdminDashboardFilters['paymentStatus']
>;
const ACTIVE_USER_ORDER_STATUSES = [
  ORDER_STATUS.pending,
  ORDER_STATUS.confirmed,
  ORDER_STATUS.processing,
  ORDER_STATUS.shipped,
];
const USER_RECENT_ORDER_LIMIT = 3;
const USER_RECENT_WISHLIST_LIMIT = 4;

const parseDashboardFilters = (
  query: Record<string, unknown>,
): IAdminDashboardFilters => {
  const dateFrom =
    typeof query.dateFrom === 'string' ? query.dateFrom.trim() : '';
  const dateTo = typeof query.dateTo === 'string' ? query.dateTo.trim() : '';
  const orderStatus =
    typeof query.orderStatus === 'string' ? query.orderStatus.trim() : '';
  const paymentStatus =
    typeof query.paymentStatus === 'string' ? query.paymentStatus.trim() : '';

  const filters: IAdminDashboardFilters = {};

  if (dateFrom) {
    filters.dateFrom = dateFrom;
  }

  if (dateTo) {
    filters.dateTo = dateTo;
  }

  if (VALID_ORDER_STATUSES.has(orderStatus)) {
    filters.orderStatus = orderStatus as TDashboardOrderStatus;
  }

  if (VALID_PAYMENT_STATUSES.has(paymentStatus)) {
    filters.paymentStatus = paymentStatus as TDashboardPaymentStatus;
  }

  return filters;
};

const buildOrderDateRange = (filters: IAdminDashboardFilters) => {
  const range: Record<string, Date> = {};

  if (filters.dateFrom) {
    const parsedDateFrom = new Date(filters.dateFrom);

    if (!Number.isNaN(parsedDateFrom.getTime())) {
      parsedDateFrom.setHours(0, 0, 0, 0);
      range.$gte = parsedDateFrom;
    }
  }

  if (filters.dateTo) {
    const parsedDateTo = new Date(filters.dateTo);

    if (!Number.isNaN(parsedDateTo.getTime())) {
      parsedDateTo.setHours(23, 59, 59, 999);
      range.$lte = parsedDateTo;
    }
  }

  return range;
};

const buildOrderMatch = (filters: IAdminDashboardFilters) => {
  const match: Record<string, unknown> = {
    isDeleted: false,
  };

  const createdAt = buildOrderDateRange(filters);

  if (Object.keys(createdAt).length > 0) {
    match.createdAt = createdAt;
  }

  if (filters.orderStatus) {
    match.orderStatus = filters.orderStatus;
  }

  if (filters.paymentStatus) {
    match.paymentStatus = filters.paymentStatus;
  }

  return match;
};

const buildUserOrderMatch = (
  userId: string,
  filters: IAdminDashboardFilters,
) => {
  return {
    ...buildOrderMatch(filters),
    user: new Types.ObjectId(userId),
  };
};

const buildRevenueMatch = (filters: IAdminDashboardFilters) => {
  return {
    ...buildOrderMatch(filters),
    orderStatus: filters.orderStatus || ORDER_STATUS.delivered,
  };
};

const buildAppliedFilters = (filters: IAdminDashboardFilters) => {
  return {
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null,
    orderStatus: filters.orderStatus || null,
    paymentStatus: filters.paymentStatus || null,
  };
};

const getAdminStatsFromDB = async (
  query: Record<string, unknown>,
): Promise<IAdminDashboardStats> => {
  const filters = parseDashboardFilters(query);
  const orderMatch = buildOrderMatch(filters);
  const revenueMatch = buildRevenueMatch(filters);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueAgg,
    monthlyRevenue,
    orderStatusSummary,
    lowStockProducts,
    recentUsers,
    recentOrders,
    recentReviews,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    Product.countDocuments({ isDeleted: false }),
    Order.countDocuments(orderMatch),
    Order.aggregate([
      {
        $match: revenueMatch,
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          ...revenueMatch,
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]),
    Order.aggregate([
      {
        $match: orderMatch,
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]),
    Product.find({ isDeleted: false, stock: { $lte: 5 } })
      .sort({ stock: 1, createdAt: -1 })
      .limit(5)
      .populate('category', 'name slug'),
    User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role status createdAt'),
    Order.find(orderMatch)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email role')
      .populate({
        path: 'items.product',
        select: 'name slug category',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      }),
    Review.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email role')
      .populate({
        path: 'product',
        select: 'name slug category',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      }),
  ]);

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    monthlyRevenue,
    orderStatusSummary,
    lowStockProducts,
    recentUsers,
    recentOrders,
    recentReviews,
    appliedFilters: buildAppliedFilters(filters),
  };
};

const getUserStatsFromDB = async (
  userId: string,
  query: Record<string, unknown>,
): Promise<IUserDashboardStats> => {
  const filters = parseDashboardFilters(query);
  const orderMatch = buildUserOrderMatch(userId, filters);
  const userObjectId = new Types.ObjectId(userId);

  const [
    totalOrders,
    activeOrders,
    deliveredOrders,
    cancelledOrders,
    orderValueAgg,
    totalReviews,
    totalWishlistItems,
    averageRatingAgg,
    orderStatusSummary,
    recentOrders,
    recentReviews,
    recentWishlistItems,
  ] = await Promise.all([
    Order.countDocuments(orderMatch),
    Order.countDocuments({
      ...orderMatch,
      orderStatus: { $in: ACTIVE_USER_ORDER_STATUSES },
    }),
    Order.countDocuments({
      ...orderMatch,
      orderStatus: ORDER_STATUS.delivered,
    }),
    Order.countDocuments({
      ...orderMatch,
      orderStatus: ORDER_STATUS.cancelled,
    }),
    Order.aggregate([
      {
        $match: {
          ...orderMatch,
          orderStatus: { $ne: ORDER_STATUS.cancelled },
        },
      },
      {
        $group: {
          _id: null,
          totalOrderValue: { $sum: '$totalPrice' },
        },
      },
    ]),
    Review.countDocuments({ user: userObjectId, isDeleted: false }),
    Wishlist.countDocuments({ user: userObjectId, isDeleted: false }),
    Review.aggregate([
      {
        $match: {
          user: userObjectId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: orderMatch,
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]),
    Order.find(orderMatch)
      .sort({ createdAt: -1 })
      .limit(USER_RECENT_ORDER_LIMIT)
      .populate({
        path: 'items.product',
        select: 'name slug category',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      }),
    Review.find({ user: userObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'product',
        select: 'name slug category',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      }),
    Wishlist.find({ user: userObjectId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(USER_RECENT_WISHLIST_LIMIT)
      .populate({
        path: 'product',
        select: 'name slug price stock category brand images',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      }),
  ]);

  return {
    totalOrders,
    activeOrders,
    deliveredOrders,
    cancelledOrders,
    totalOrderValue: orderValueAgg[0]?.totalOrderValue || 0,
    totalReviews,
    totalWishlistItems,
    averageRating: averageRatingAgg[0]?.averageRating || 0,
    orderStatusSummary,
    recentOrders,
    recentReviews,
    recentWishlistItems,
    appliedFilters: buildAppliedFilters(filters),
  };
};

export const DashboardServices = {
  getAdminStatsFromDB,
  getUserStatsFromDB,
};
