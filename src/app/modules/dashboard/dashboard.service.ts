import { ORDER_STATUS } from '../order/order.constant.js';
import { Order } from '../order/order.model.js';
import { Product } from '../product/product.model.js';
import { Review } from '../review/review.model.js';
import { User } from '../user/user.model.js';

const getAdminStatsFromDB = async () => {
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
    Order.countDocuments({ isDeleted: false }),
    Order.aggregate([
      {
        $match: {
          isDeleted: false,
          orderStatus: ORDER_STATUS.delivered,
        },
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
          isDeleted: false,
          orderStatus: ORDER_STATUS.delivered,
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
        $match: {
          isDeleted: false,
        },
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
    Order.find({ isDeleted: false })
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
  };
};

export const DashboardServices = {
  getAdminStatsFromDB,
};
