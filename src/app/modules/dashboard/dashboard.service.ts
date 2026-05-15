import { ORDER_STATUS } from '../order/order.constant.js';
import { Order } from '../order/order.model.js';
import { Product } from '../product/product.model.js';
import { User } from '../user/user.model.js';

const getAdminStatsFromDB = async () => {
  const [totalUsers, totalProducts, totalOrders, revenueAgg, recentOrders] =
    await Promise.all([
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
    ]);

  return {
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue: revenueAgg[0]?.totalRevenue || 0,
    recentOrders,
  };
};

export const DashboardServices = {
  getAdminStatsFromDB,
};
