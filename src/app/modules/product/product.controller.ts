import type { Request } from 'express';
import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ProductServices } from './product.service.js';

const getUploadedImageUrls = (req: Request) => {
  if (!Array.isArray(req.files) || req.files.length === 0) {
    return undefined;
  }

  return req.files.map(
    (file) =>
      `${req.protocol}://${req.get('host')}/uploads/products/${file.filename}`,
  );
};

const createProduct = catchAsync(async (req, res) => {
  const images = getUploadedImageUrls(req);
  const result = await ProductServices.createProductIntoDB({
    ...req.body,
    ...(images ? { images } : {}),
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Products retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getSingleProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Product id is required');
  }

  const result = await ProductServices.getSingleProductFromDB(id);

  if (!result) {
    throw new AppError(404, 'Product not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Product id is required');
  }

  const images = getUploadedImageUrls(req);
  const result = await ProductServices.updateProductIntoDB(id, {
    ...req.body,
    ...(images ? { images } : {}),
  });

  if (!result) {
    throw new AppError(404, 'Product not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product updated successfully',
    data: result,
  });
});

const deleteSingleProduct = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Product id is required');
  }

  const result = await ProductServices.deleteSingleProductFromDB(id);

  if (!result) {
    throw new AppError(404, 'Product not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Product deleted successfully',
    data: result,
  });
});

export const ProductControllers = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteSingleProduct,
};
