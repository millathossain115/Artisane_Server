import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ReviewServices } from './review.service.js';

const createReview = catchAsync(async (req, res) => {
  const result = await ReviewServices.createReviewIntoDB(req.user.userId, req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Review created successfully',
    data: result,
  });
});

const getAllReviews = catchAsync(async (_req, res) => {
  const result = await ReviewServices.getAllReviewsFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviews retrieved successfully',
    data: result,
  });
});

const getReviewsByProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;

  if (!productId || Array.isArray(productId)) {
    throw new AppError(400, 'Product id is required');
  }

  const result = await ReviewServices.getReviewsByProductFromDB(productId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product reviews retrieved successfully',
    data: result,
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

const deleteSingleReview = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Review id is required');
  }

  const result = await ReviewServices.deleteSingleReviewFromDB(
    id,
    req.user.userId,
    req.user.role,
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
  getAllReviews,
  getReviewsByProduct,
  getSingleReview,
  updateReview,
  deleteSingleReview,
};
