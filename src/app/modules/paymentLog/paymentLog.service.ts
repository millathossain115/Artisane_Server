import type { IPaymentLog } from './paymentLog.interface.js';
import { PaymentLog } from './paymentLog.model.js';

export const createPaymentLog = async (payload: IPaymentLog) => {
  return await PaymentLog.create(payload);
};

export const getAllPaymentLogs = async (query: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  paymentMethod?: string;
}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.paymentMethod) {
    filter.paymentMethod = query.paymentMethod;
  }

  if (query.search) {
    filter.$or = [
      { transactionId: { $regex: query.search, $options: 'i' } },
      { publicRef: { $regex: query.search, $options: 'i' } },
      { errorMessage: { $regex: query.search, $options: 'i' } },
    ];
  }

  const logs = await PaymentLog.find(filter)
    .populate('orderId', 'orderNumber grandTotal customerInfo paymentStatus')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await PaymentLog.countDocuments(filter);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: logs,
  };
};

export const getPaymentLogByPublicRef = async (publicRef: string) => {
  return await PaymentLog.findOne({ publicRef })
    .populate('orderId', 'orderNumber grandTotal customerInfo paymentStatus')
    .populate('userId', 'name email');
};

export const getPaymentLogStats = async () => {
  const totalLogs = await PaymentLog.countDocuments();
  const paidLogs = await PaymentLog.countDocuments({ status: 'Paid' });
  const failedLogs = await PaymentLog.countDocuments({ status: 'Failed' });
  const refundedLogs = await PaymentLog.countDocuments({ status: 'Refunded' });

  const revenueAggregation = await PaymentLog.aggregate([
    { $match: { status: 'Paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
  ]);

  const totalRevenue = revenueAggregation[0]?.totalRevenue || 0;
  const successRate =
    totalLogs > 0 ? ((paidLogs / totalLogs) * 100).toFixed(1) : '0';

  return {
    totalLogs,
    paidLogs,
    failedLogs,
    refundedLogs,
    totalRevenue,
    successRate: Number(successRate),
  };
};
