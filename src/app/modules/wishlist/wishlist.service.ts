import { Query } from 'mongoose';
import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import '../category/category.model.js';
import { Product } from '../product/product.model.js';
import { User } from '../user/user.model.js';
import type {
  ICreateWishlistPayload,
  IWishlist,
} from './wishlist.interface.js';
import { Wishlist } from './wishlist.model.js';

const populateWishlist = <T>(query: Query<T, IWishlist>) =>
  query.populate('user', 'name email role').populate({
    path: 'product',
    select: 'name slug price stock category brand images',
    populate: {
      path: 'category',
      select: 'name slug',
    },
  });

const createWishlistIntoDB = async (
  userId: string,
  payload: ICreateWishlistPayload,
) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  const product = await Product.findOne({
    _id: payload.product,
    isDeleted: false,
  });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  const existingWishlist = await Wishlist.findOne({
    user: user._id,
    product: product._id,
  });

  if (existingWishlist) {
    if (existingWishlist.isDeleted) {
      existingWishlist.isDeleted = false;
      await existingWishlist.save();
    }

    return populateWishlist(Wishlist.findById(existingWishlist._id));
  }

  const createdWishlist = await Wishlist.create({
    user: user._id,
    product: product._id,
  });

  return populateWishlist(Wishlist.findById(createdWishlist._id));
};

const getMyWishlistFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Wishlist.countDocuments({ user: userId, isDeleted: false }),
    populateWishlist(
      Wishlist.find({ user: userId, isDeleted: false })
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

const getDashboardWishlistFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const rawLimit = typeof query.limit === 'string' ? Number(query.limit) : 4;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 12) : 4;

  const [total, result] = await Promise.all([
    Wishlist.countDocuments({ user: userId, isDeleted: false }),
    populateWishlist(
      Wishlist.find({ user: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(Math.floor(limit)),
    ),
  ]);

  return {
    total,
    result,
  };
};

const deleteWishlistFromDB = async (
  id: string,
  userId: string,
  userRole: string,
) => {
  const wishlist = await Wishlist.findOne({ _id: id, isDeleted: false });

  if (!wishlist) {
    return null;
  }

  if (userRole !== 'admin' && wishlist.user.toString() !== userId) {
    throw new AppError(403, 'You are not allowed to delete this wishlist item');
  }

  return populateWishlist(
    Wishlist.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { returnDocument: 'after' },
    ),
  );
};

const deleteWishlistByProductFromDB = async (
  productId: string,
  userId: string,
) => {
  const result = await populateWishlist(
    Wishlist.findOneAndUpdate(
      { user: userId, product: productId, isDeleted: false },
      { isDeleted: true },
      { returnDocument: 'after' },
    ),
  );

  return result;
};

const clearMyWishlistFromDB = async (userId: string) => {
  const result = await Wishlist.updateMany(
    { user: userId, isDeleted: false },
    { isDeleted: true },
  );

  return {
    deletedCount: result.modifiedCount,
  };
};

export const WishlistServices = {
  createWishlistIntoDB,
  getMyWishlistFromDB,
  getDashboardWishlistFromDB,
  deleteWishlistFromDB,
  deleteWishlistByProductFromDB,
  clearMyWishlistFromDB,
};
