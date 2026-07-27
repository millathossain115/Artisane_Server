import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import type {
  IActivityLogContext,
  TActivityActorRole,
} from '../activityLog/activityLog.interface.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import { ORDER_STATUS, PAYMENT_STATUS } from '../order/order.constant.js';
import { Order } from '../order/order.model.js';
import { Product } from '../product/product.model.js';
import { isAdminRole } from '../user/user.constant.js';
import { User } from '../user/user.model.js';
import type {
  ICreateReviewPayload,
  IUpdateReviewPayload,
  IUpdateReviewVisibilityPayload,
} from './review.interface.js';
import { Review } from './review.model.js';

const reviewPopulate = [
  { path: 'user', select: 'name email role' },
  {
    path: 'product',
    select: 'name slug price category images',
    populate: {
      path: 'category',
      select: 'name slug',
    },
  },
  { path: 'hiddenBy', select: 'name email role' },
] as const;

const getActivityActorRole = (role: string): TActivityActorRole => {
  if (role === 'super_admin') {
    return 'super_admin';
  }

  return role === 'admin' ? 'admin' : 'user';
};

const publicReviewFilter = {
  isDeleted: false,
  isHidden: { $ne: true },
};

const activeReviewFilter = {
  isDeleted: false,
};

const getReviewableProductIds = async (userId: string) => {
  const deliveredPaidOrders = await Order.find({
    isDeleted: false,
    orderStatus: ORDER_STATUS.delivered,
    paymentStatus: PAYMENT_STATUS.paid,
    user: userId,
  }).select('items.product');

  return [
    ...new Set(
      deliveredPaidOrders.flatMap((order) =>
        order.items
          .filter((item) => Boolean(item.product))
          .map((item) => item.product.toString()),
      ),
    ),
  ];
};

const assertProductIsReviewable = async (userId: string, productId: string) => {
  const purchasedDeliveredPaidOrder = await Order.exists({
    isDeleted: false,
    items: { $elemMatch: { product: productId } },
    orderStatus: ORDER_STATUS.delivered,
    paymentStatus: PAYMENT_STATUS.paid,
    user: userId,
  });

  if (!purchasedDeliveredPaidOrder) {
    throw new AppError(
      403,
      'You can review only purchased, delivered, paid products',
    );
  }
};

const createReviewIntoDB = async (
  userId: string,
  payload: ICreateReviewPayload,
  activityContext?: IActivityLogContext,
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
  });

  if (existingReview) {
    throw new AppError(
      409,
      existingReview.isDeleted
        ? 'Deleted review cannot be recreated for this product'
        : 'You have already reviewed this product',
    );
  }

  await assertProductIsReviewable(userId, payload.product);

  const createdReview = await Review.create({
    user: user._id,
    product: product._id,
    rating: payload.rating,
    ...(payload.comment ? { comment: payload.comment } : {}),
  });

  const result = await Review.findById(createdReview._id)
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1]);

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'review.created',
      actorId: userId,
      actorRole: activityContext?.actorRole ?? 'user',
      metadata: { rating: result.rating },
      module: 'reviews',
      severity: 'low',
      source: activityContext?.source ?? 'user',
      status: 'success',
      summary: `${user.name} reviewed ${product.name}`,
      targetId: result._id.toString(),
      targetLabel: product.name,
      targetType: 'review',
    });
  }

  return result;
};

const getAllReviewsFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Review.countDocuments(publicReviewFilter),
    Review.find(publicReviewFilter)
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
    Review.countDocuments({ ...publicReviewFilter, product: productId }),
    Review.find({ ...publicReviewFilter, product: productId })
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
  const result = await Review.findOne({ _id: id, ...publicReviewFilter })
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1])
    .populate(reviewPopulate[2]);

  return result;
};

const getAdminReviewsFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Review.countDocuments(activeReviewFilter),
    Review.find(activeReviewFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(reviewPopulate[0])
      .populate(reviewPopulate[1])
      .populate(reviewPopulate[2]),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getMyReviewsFromDB = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    Review.countDocuments({ ...activeReviewFilter, user: userId }),
    Review.find({ ...activeReviewFilter, user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate(reviewPopulate[0])
      .populate(reviewPopulate[1])
      .populate(reviewPopulate[2]),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getReviewableProductsFromDB = async (userId: string) => {
  const purchasedProductIds = await getReviewableProductIds(userId);

  if (!purchasedProductIds.length) {
    return [];
  }

  const reviewedProducts = await Review.find({
    isDeleted: false,
    product: { $in: purchasedProductIds },
    user: userId,
  }).select('product');
  const reviewedProductIds = new Set(
    reviewedProducts.map((review) => review.product.toString()),
  );
  const reviewableProductIds = purchasedProductIds.filter(
    (productId) => !reviewedProductIds.has(productId),
  );

  if (!reviewableProductIds.length) {
    return [];
  }

  return Product.find({
    _id: { $in: reviewableProductIds },
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .populate('category', 'name slug');
};

const updateReviewIntoDB = async (
  id: string,
  userId: string,
  userRole: string,
  payload: IUpdateReviewPayload,
  activityContext?: IActivityLogContext,
) => {
  const review = await Review.findOne({ _id: id, isDeleted: false });

  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  if (!isAdminRole(userRole) && review.user.toString() !== userId) {
    throw new AppError(403, 'You are not allowed to update this review');
  }

  const result = await Review.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { returnDocument: 'after', runValidators: true },
  )
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1]);

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'review.updated',
      actorId: userId,
      actorRole: getActivityActorRole(userRole),
      changes: ActivityLogServices.buildActivityChanges(review, result, [
        'rating',
        'comment',
      ]),
      module: 'reviews',
      severity: 'low',
      source:
        activityContext?.source ?? (isAdminRole(userRole) ? 'admin' : 'user'),
      status: 'success',
      summary: `Review ${result._id.toString()} was updated`,
      targetId: result._id.toString(),
      targetLabel: result._id.toString(),
      targetType: 'review',
    });
  }

  return result;
};

const deleteSingleReviewFromDB = async (
  id: string,
  userId: string,
  userRole: string,
  activityContext?: IActivityLogContext,
) => {
  const review = await Review.findOne({ _id: id, isDeleted: false });

  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  if (!isAdminRole(userRole) && review.user.toString() !== userId) {
    throw new AppError(403, 'You are not allowed to delete this review');
  }

  const result = await Review.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { returnDocument: 'after' },
  )
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1]);

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'review.deleted',
      actorId: userId,
      actorRole: getActivityActorRole(userRole),
      changes: [{ after: true, before: false, field: 'isDeleted' }],
      module: 'reviews',
      severity: isAdminRole(userRole) ? 'medium' : 'low',
      source:
        activityContext?.source ?? (isAdminRole(userRole) ? 'admin' : 'user'),
      status: 'success',
      summary: `Review ${result._id.toString()} was deleted`,
      targetId: result._id.toString(),
      targetLabel: result._id.toString(),
      targetType: 'review',
    });
  }

  return result;
};

const updateReviewVisibilityIntoDB = async (
  id: string,
  adminId: string,
  payload: IUpdateReviewVisibilityPayload,
  activityContext?: IActivityLogContext,
) => {
  const review = await Review.findOne({ _id: id, isDeleted: false });

  if (!review) {
    throw new AppError(404, 'Review not found');
  }

  const update = payload.isHidden
    ? {
        isHidden: true,
        hiddenAt: new Date(),
        hiddenBy: adminId,
      }
    : {
        $unset: {
          hiddenAt: '',
          hiddenBy: '',
        },
        isHidden: false,
      };

  const result = await Review.findOneAndUpdate(
    { _id: id, isDeleted: false },
    update,
    { returnDocument: 'after', runValidators: true },
  )
    .populate(reviewPopulate[0])
    .populate(reviewPopulate[1])
    .populate(reviewPopulate[2]);

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: payload.isHidden ? 'review.hidden' : 'review.unhidden',
      actorId: adminId,
      actorRole: 'admin',
      changes: ActivityLogServices.buildActivityChanges(review, result, [
        'isHidden',
        'hiddenAt',
        'hiddenBy',
      ]),
      module: 'reviews',
      severity: 'medium',
      source: activityContext?.source ?? 'admin',
      status: 'success',
      summary: `Review ${result._id.toString()} was ${
        payload.isHidden ? 'hidden' : 'unhidden'
      }`,
      targetId: result._id.toString(),
      targetLabel: result._id.toString(),
      targetType: 'review',
    });
  }

  return result;
};

export const ReviewServices = {
  createReviewIntoDB,
  getAdminReviewsFromDB,
  getAllReviewsFromDB,
  getMyReviewsFromDB,
  getReviewableProductsFromDB,
  getReviewsByProductFromDB,
  getSingleReviewFromDB,
  updateReviewIntoDB,
  updateReviewVisibilityIntoDB,
  deleteSingleReviewFromDB,
};
