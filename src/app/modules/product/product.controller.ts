import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ProductServices } from './product.service.js';

const createProduct = catchAsync(async (req, res) => {
  console.log('Product.create req.body: ', req.body);
  const result = await ProductServices.createProductIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Product created successfully',
    data: result,
  });
});

const getAllProducts = catchAsync(async (_req, res) => {
  const result = await ProductServices.getAllProductsFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Products retrieved successfully',
    data: result,
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

  const result = await ProductServices.updateProductIntoDB(id, req.body);

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
