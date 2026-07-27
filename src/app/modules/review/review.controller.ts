import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import { ReviewServices } from './review.service.js';

const createReview = catchAsync(async (req, res) => {
  const result = await ReviewServices.createReviewIntoDB(
    req.user.userId,
    req.body,
    ActivityLogServices.createActivityContext(req),
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getAllReviews = catchAsync(async (req, res) => {
  const result = await ReviewServices.getAllReviewsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviews retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getAdminReviews = catchAsync(async (req, res) => {
  const result = await ReviewServices.getAdminReviewsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin reviews retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getMyReviews = catchAsync(async (req, res) => {
  const result = await ReviewServices.getMyReviewsFromDB(
    req.user.userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My reviews retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getReviewableProducts = catchAsync(async (req, res) => {
  const result = await ReviewServices.getReviewableProductsFromDB(
    req.user.userId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviewable products retrieved successfully',
    data: result,
  });
});

const getReviewsByProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;

  if (!productId || Array.isArray(productId)) {
    throw new AppError(400, 'Product id is required');
  }

  const result = await ReviewServices.getReviewsByProductFromDB(
    productId,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product reviews retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getSingleReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Review id is required');
  }

  const result = await ReviewServices.getSingleReviewFromDB(id);

  if (!result) {
    throw new AppError(404, 'Review not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review retrieved successfully',
    data: result,
  });
});

const updateReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Review id is required');
  }

  const result = await ReviewServices.updateReviewIntoDB(
    id,
    req.user.userId,
    req.user.role,
    req.body,
    ActivityLogServices.createActivityContext(req),
  );

  if (!result) {
    throw new AppError(404, 'Review not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

const updateReviewVisibility = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Review id is required');
  }

  const result = await ReviewServices.updateReviewVisibilityIntoDB(
    id,
    req.user.userId,
    req.body,
    ActivityLogServices.createActivityContext(req),
  );

  if (!result) {
    throw new AppError(404, 'Review not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review visibility updated successfully',
    data: result,
  });
});

const deleteSingleReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Review id is required');
  }

  const result = await ReviewServices.deleteSingleReviewFromDB(
    id,
    req.user.userId,
    req.user.role,
    ActivityLogServices.createActivityContext(req),
  );

  if (!result) {
    throw new AppError(404, 'Review not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review deleted successfully',
    data: result,
  });
});

export const ReviewControllers = {
  createReview,
  getAdminReviews,
  getAllReviews,
  getMyReviews,
  getReviewableProducts,
  getReviewsByProduct,
  getSingleReview,
  updateReview,
  updateReviewVisibility,
  deleteSingleReview,
};
