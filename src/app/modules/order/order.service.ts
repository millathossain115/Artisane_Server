import AppError from '../../errors/appError.js';
import { Product } from '../product/product.model.js';
import { User } from '../user/user.model.js';
import type {
  ICreateOrderPayload,
  IOrder,
  IOrderItem,
} from './order.interface.js';
import { Order } from './order.model.js';

const populateOrderQuery = () =>
  Order.find()
    .populate('user', 'name email role')
    .populate({
      path: 'items.product',
      select: 'name slug price category',
      populate: {
        path: 'category',
        select: 'name slug',
      },
    });

const populateSingleOrderQuery = (id: string) =>
  Order.findById(id)
    .populate('user', 'name email role')
    .populate({
      path: 'items.product',
      select: 'name slug price category',
      populate: {
        path: 'category',
        select: 'name slug',
      },
    });

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
    ...(payload.notes ? { notes: payload.notes } : {}),
  };

  const createdOrder = await Order.create(orderPayload);
  const result = await populateSingleOrderQuery(createdOrder._id.toString());

  return result;
};

const getMyOrdersFromDB = async (userId: string) => {
  const result = await Order.find({ user: userId, isDeleted: false })
    .populate('user', 'name email role')
    .populate({
      path: 'items.product',
      select: 'name slug price category',
      populate: {
        path: 'category',
        select: 'name slug',
      },
    });

  return result;
};

const getAllOrdersFromDB = async () => {
  const result = await populateOrderQuery().find({ isDeleted: false });
  return result;
};

const getSingleOrderFromDB = async (id: string) => {
  const result = await Order.findOne({ _id: id, isDeleted: false })
    .populate('user', 'name email role')
    .populate({
      path: 'items.product',
      select: 'name slug price category',
      populate: {
        path: 'category',
        select: 'name slug',
      },
    });

  return result;
};

const updateOrderStatusIntoDB = async (
  id: string,
  payload: Partial<Pick<IOrder, 'orderStatus' | 'paymentStatus'>>,
) => {
  const result = await Order.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true, runValidators: true },
  )
    .populate('user', 'name email role')
    .populate({
      path: 'items.product',
      select: 'name slug price category',
      populate: {
        path: 'category',
        select: 'name slug',
      },
    });

  return result;
};

const deleteSingleOrderFromDB = async (id: string) => {
  const result = await Order.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  )
    .populate('user', 'name email role')
    .populate({
      path: 'items.product',
      select: 'name slug price category',
      populate: {
        path: 'category',
        select: 'name slug',
      },
    });

  return result;
};

export const OrderServices = {
  createOrderIntoDB,
  getMyOrdersFromDB,
  getAllOrdersFromDB,
  getSingleOrderFromDB,
  updateOrderStatusIntoDB,
  deleteSingleOrderFromDB,
};
