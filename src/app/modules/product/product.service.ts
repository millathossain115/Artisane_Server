import mongoose from 'mongoose';
import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import { Category } from '../category/category.model.js';
import type { IProduct } from './product.interface.js';
import { Product } from './product.model.js';
import { buildProductAggregationPipeline } from './product.queryBuilder.js';

const createProductIntoDB = async (payload: IProduct) => {
  const existingProduct = await Product.findOne({
    slug: payload.slug,
  });

  if (existingProduct) {
    throw new AppError(409, 'Product already exists');
  }

  const existingCategory = await Category.findOne({
    _id: payload.category,
    isDeleted: false,
  });

  if (!existingCategory) {
    throw new AppError(404, 'Category not found');
  }

  const createdProduct = await Product.create(payload);

  const result = await Product.findById(createdProduct._id).populate(
    'category',
    'name slug',
  );

  return result;
};

const getAllProductsFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const [aggregationResult] = await Product.aggregate(
    buildProductAggregationPipeline(query, skip, limit),
  );

  const total = aggregationResult?.meta?.[0]?.total || 0;

  return {
    meta: buildPaginationMeta(page, limit, total),
    result: aggregationResult?.data || [],
  };
};

const getSingleProductFromDB = async (id: string) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const filter = isObjectId
    ? { $or: [{ _id: id }, { slug: id }], isDeleted: false }
    : { slug: id, isDeleted: false };

  const result = await Product.findOne(filter).populate(
    'category',
    'name slug',
  );
  return result;
};

const updateProductIntoDB = async (id: string, payload: Partial<IProduct>) => {
  if (payload.slug) {
    const existingProduct = await Product.findOne({
      _id: { $ne: id },
      slug: payload.slug,
    });

    if (existingProduct) {
      throw new AppError(409, 'Product already exists');
    }
  }

  if (payload.category) {
    const existingCategory = await Category.findOne({
      _id: payload.category,
      isDeleted: false,
    });

    if (!existingCategory) {
      throw new AppError(404, 'Category not found');
    }
  }

  await Product.findOneAndUpdate({ _id: id, isDeleted: false }, payload, {
    new: true,
    runValidators: true,
  });

  const result = await Product.findOne({ _id: id, isDeleted: false }).populate(
    'category',
    'name slug',
  );

  return result;
};

const deleteSingleProductFromDB = async (id: string) => {
  const result = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  ).populate('category', 'name slug');

  return result;
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductIntoDB,
  deleteSingleProductFromDB,
};
