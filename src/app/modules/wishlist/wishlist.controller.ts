import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { WishlistServices } from './wishlist.service.js';

const createWishlist = catchAsync(async (req, res) => {
  const result = await WishlistServices.createWishlistIntoDB(
    req.user.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Wishlist item added successfully',
    data: result,
  });
});

const getMyWishlist = catchAsync(async (req, res) => {
  const result = await WishlistServices.getMyWishlistFromDB(
    req.user.userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getDashboardWishlist = catchAsync(async (req, res) => {
  const result = await WishlistServices.getDashboardWishlistFromDB(
    req.user.userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard wishlist retrieved successfully',
    meta: { total: result.total },
    data: result.result,
  });
});

const deleteWishlist = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Wishlist id is required');
  }

  const result = await WishlistServices.deleteWishlistFromDB(
    id,
    req.user.userId,
    req.user.role,
  );

  if (!result) {
    throw new AppError(404, 'Wishlist item not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist item deleted successfully',
    data: result,
  });
});

const deleteWishlistByProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;

  if (!productId || Array.isArray(productId)) {
    throw new AppError(400, 'Product id is required');
  }

  const result = await WishlistServices.deleteWishlistByProductFromDB(
    productId,
    req.user.userId,
  );

  if (!result) {
    throw new AppError(404, 'Wishlist item not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist item deleted successfully',
    data: result,
  });
});

const clearMyWishlist = catchAsync(async (req, res) => {
  const result = await WishlistServices.clearMyWishlistFromDB(req.user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Wishlist cleared successfully',
    data: result,
  });
});

export const WishlistControllers = {
  createWishlist,
  getMyWishlist,
  getDashboardWishlist,
  deleteWishlist,
  deleteWishlistByProduct,
  clearMyWishlist,
};
