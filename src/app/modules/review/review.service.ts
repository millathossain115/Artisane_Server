import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import { Product } from '../product/product.model.js';
import { User } from '../user/user.model.js';
import type {
  ICreateReviewPayload,
  IUpdateReviewPayload,
} from './review.interface.js';
import { Review } from './review.model.js';

const reviewPopulate = [
  { path: 'user', select: 'name email role' },
  {
    path: 'product',
    select: 'name slug price category',
    populate: {
      path: 'category',
      select: 'name slug',
    },
  },
] as const;

const createReviewIntoDB = async (
  userId: string,
  payload: ICreateReviewPayload,
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

  const existingReview = await Review.findOne({
    user: userId,
    product: payload.product,
    isDeleted: false,
  });

  if (existingReview) {
    throw new AppError(409, 'You have already reviewed this product');
  }

  const createdReview = await Review.create({
    user: user._id,
    product: product._id,
    rating: payload.rating,
    ...(payload.comment ? { comment: payload.comment } : {}),
  });

  const result = await Review.findById(createdReview._id)
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1]);

  return result;
};

const getAllReviewsFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Review.countDocuments({ isDeleted: false }),
    Review.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(reviewPopulate[0])
      .populate(reviewPopulate[1]),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getReviewsByProductFromDB = async (
  productId: string,
  query: Record<string, unknown>,
) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Review.countDocuments({ product: productId, isDeleted: false }),
    Review.find({ product: productId, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(reviewPopulate[0])
      .populate(reviewPopulate[1]),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getSingleReviewFromDB = async (id: string) => {
  const result = await Review.findOne({ _id: id, isDeleted: false })
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1]);

  return result;
};

const updateReviewIntoDB = async (
  id: string,
  userId: string,
  userRole: string,
  payload: IUpdateReviewPayload,
) => {
  const review = await Review.findOne({ _id: id, isDeleted: false });

  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  if (userRole !== 'admin' && review.user.toString() !== userId) {
    throw new AppError(403, 'You are not allowed to update this review');
  }

  const result = await Review.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true, runValidators: true },
  )
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1]);

  return result;
};

const deleteSingleReviewFromDB = async (
  id: string,
  userId: string,
  userRole: string,
) => {
  const review = await Review.findOne({ _id: id, isDeleted: false });

  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  if (userRole !== 'admin' && review.user.toString() !== userId) {
    throw new AppError(403, 'You are not allowed to delete this review');
  }

  const result = await Review.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  )
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1]);

  return result;
};

export const ReviewServices = {
  createReviewIntoDB,
  getAllReviewsFromDB,
  getReviewsByProductFromDB,
  getSingleReviewFromDB,
  updateReviewIntoDB,
  deleteSingleReviewFromDB,
};
