import type { Request } from 'express';
import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { CategoryServices } from './category.service.js';

const getUploadedImageUrl = (req: Request) => {
  if (!req.file) {
    return undefined;
  }

  return `${req.protocol}://${req.get('host')}/uploads/categories/${
    req.file.filename
  }`;
};

const createCategory = catchAsync(async (req, res) => {
  console.log('Category.create req.body: ', req.body);
  const image = getUploadedImageUrl(req);
  const result = await CategoryServices.createCategoryIntoDB({
    ...req.body,
    ...(image ? { image } : {}),
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategories = catchAsync(async (_req, res) => {
  console.log('Category.getAll _req: ', _req);
  const result = await CategoryServices.getAllCategoriesFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Categories retrieved successfully',
    data: result,
  });
});

const getSingleCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  console.log('Category.getSingle id: ', id);
  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Category id is required');
  }

  const result = await CategoryServices.getSingleCategoryFromDB(id);

  if (!result) {
    throw new AppError(404, 'Category not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

const updateCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  console.log('Category.update id: ', id);
  console.log('Category.update req.body: ', req.body);
  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Category id is required');
  }

  const image = getUploadedImageUrl(req);
  const result = await CategoryServices.updateCategoryIntoDB(id, {
    ...req.body,
    ...(image ? { image } : {}),
  });

  if (!result) {
    throw new AppError(404, 'Category not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

const deleteSingleCategory = catchAsync(async (req, res) => {
  const { id } = req.params;
  console.log('Category.delete id: ', id);
  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Category id is required');
  }

  const result = await CategoryServices.deleteSingleCategoryFromDB(id);

  if (!result) {
    throw new AppError(404, 'Category not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

export const CategoryControllers = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteSingleCategory,
};
