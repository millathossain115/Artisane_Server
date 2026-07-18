import { Query } from 'mongoose';
import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import { Product } from '../product/product.model.js';
import { User } from '../user/user.model.js';
import {
  CANCELLABLE_ORDER_STATUSES,
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS,
} from './order.constant.js';
import type {
  ICreateOrderPayload,
  IOrder,
  IOrderItem,
} from './order.interface.js';
import { Order } from './order.model.js';

const populateOrder = <T>(query: Query<T, IOrder>) =>
  query.populate('user', 'name email role').populate({
    path: 'items.product',
    select: 'name slug price category',
    populate: {
      path: 'category',
      select: 'name slug',
    },
  });

const restoreOrderStock = async (items: IOrderItem[]) => {
  for (const item of items) {
    const product = await Product.findById(item.product);

    if (!product || product.isDeleted) {
      continue;
    }

    product.stock += item.quantity;
    await product.save();
  }
};

const createOrderIntoDB = async (
  userId: string,
  payload: ICreateOrderPayload,
) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const orderItems: IOrderItem[] = [];
  let totalPrice = 0;

  for (const item of payload.items) {
    const product = await Product.findOne({
      _id: item.product,
      isDeleted: false,
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    if (product.stock < item.quantity) {
      throw new AppError(400, `Insufficient stock for ${product.name}`);
    }

    const subtotal = product.price * item.quantity;

    orderItems.push({
      product: product._id,
      productName: product.name,
      productSlug: product.slug,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal,
    });

    totalPrice += subtotal;
  }

  for (const item of payload.items) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    product.stock -= item.quantity;
    await product.save();
  }

  const orderPayload: IOrder = {
    user: user._id,
    items: orderItems,
    totalPrice,
    shippingAddress: payload.shippingAddress,
    contactPhone: payload.contactPhone,
    paymentMethod: payload.paymentMethod,
    ...(payload.notes ? { notes: payload.notes } : {}),
  };

  const createdOrder = await Order.create(orderPayload);
  const result = await populateOrder(Order.findById(createdOrder._id));

  return result;
};

const getMyOrdersFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Order.countDocuments({ user: userId, isDeleted: false }),
    populateOrder(
      Order.find({ user: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getAllOrdersFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Order.countDocuments({ isDeleted: false }),
    populateOrder(
      Order.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getSingleOrderFromDB = async (id: string) => {
  const result = await populateOrder(
    Order.findOne({ _id: id, isDeleted: false }),
  );

  return result;
};

const updateOrderStatusIntoDB = async (
  id: string,
  payload: Partial<Pick<IOrder, 'orderStatus' | 'paymentStatus'>>,
) => {
  const order = await Order.findOne({ _id: id, isDeleted: false });

  if (!order) {
    return null;
  }

  if (payload.orderStatus) {
    if (payload.orderStatus === ORDER_STATUS.cancelled) {
      throw new AppError(400, 'Use the cancel order route to cancel an order');
    }

    const currentStatus = order.orderStatus || ORDER_STATUS.pending;
    const allowedTransitions = [
      ...ORDER_STATUS_TRANSITIONS[currentStatus],
    ] as string[];

    if (!allowedTransitions.includes(payload.orderStatus)) {
      throw new AppError(
        400,
        `Invalid order status transition from ${currentStatus} to ${payload.orderStatus}`,
      );
    }
  }

  const result = await populateOrder(
    Order.findOneAndUpdate({ _id: id, isDeleted: false }, payload, {
      new: true,
      runValidators: true,
    }),
  );

  return result;
};

const cancelOrderIntoDB = async (
  id: string,
  userId: string,
  userRole: string,
) => {
  const order = await Order.findOne({ _id: id, isDeleted: false });

  if (!order) {
    return null;
  }

  if (userRole !== 'admin' && order.user.toString() !== userId) {
    throw new AppError(403, 'You are not allowed to cancel this order');
  }

  const currentStatus = order.orderStatus || ORDER_STATUS.pending;

  if (
    !(CANCELLABLE_ORDER_STATUSES as readonly string[]).includes(currentStatus)
  ) {
    throw new AppError(
      400,
      `Order cannot be cancelled when status is ${currentStatus}`,
    );
  }

  await restoreOrderStock(order.items);

  const nextPaymentStatus =
    order.paymentStatus === PAYMENT_STATUS.paid
      ? PAYMENT_STATUS.refunded
      : order.paymentStatus;

  const result = await populateOrder(
    Order.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        orderStatus: ORDER_STATUS.cancelled,
        paymentStatus: nextPaymentStatus,
      },
      { new: true, runValidators: true },
    ),
  );

  return result;
};

const deleteSingleOrderFromDB = async (id: string) => {
  const result = await populateOrder(
    Order.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true },
    ),
  );

  return result;
};

export const OrderServices = {
  createOrderIntoDB,
  getMyOrdersFromDB,
  getAllOrdersFromDB,
  getSingleOrderFromDB,
  updateOrderStatusIntoDB,
  cancelOrderIntoDB,
  deleteSingleOrderFromDB,
};
