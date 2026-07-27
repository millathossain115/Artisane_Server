import mongoose from 'mongoose';
import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import { Category } from '../category/category.model.js';
import type { IActivityLogContext } from '../activityLog/activityLog.interface.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import type { IProduct } from './product.interface.js';
import { Product } from './product.model.js';
import { buildProductAggregationPipeline } from './product.queryBuilder.js';

const createProductIntoDB = async (
  payload: IProduct,
  activityContext?: IActivityLogContext,
) => {
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

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'product.created',
      module: 'products',
      severity: 'low',
      status: 'success',
      summary: `Product ${result.name} was created`,
      targetId: result._id.toString(),
      targetLabel: result.name,
      targetType: 'product',
    });
  }

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

const updateProductIntoDB = async (
  id: string,
  payload: Partial<IProduct>,
  activityContext?: IActivityLogContext,
) => {
  const existingProduct = await Product.findOne({
    _id: id,
    isDeleted: false,
  }).populate('category', 'name slug');

  if (!existingProduct) {
    return null;
  }

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
    returnDocument: 'after',
    runValidators: true,
  });

  const result = await Product.findOne({ _id: id, isDeleted: false }).populate(
    'category',
    'name slug',
  );

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'product.updated',
      changes: ActivityLogServices.buildActivityChanges(existingProduct, result, [
        'name',
        'slug',
        'description',
        'price',
        'stock',
        'category',
        'brand',
        'images',
      ]),
      module: 'products',
      severity: 'low',
      status: 'success',
      summary: `Product ${result.name} was updated`,
      targetId: result._id.toString(),
      targetLabel: result.name,
      targetType: 'product',
    });
  }

  return result;
};

const deleteSingleProductFromDB = async (
  id: string,
  activityContext?: IActivityLogContext,
) => {
  const result = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { returnDocument: 'after' },
  ).populate('category', 'name slug');

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'product.deleted',
      changes: [{ after: true, before: false, field: 'isDeleted' }],
      module: 'products',
      severity: 'medium',
      status: 'success',
      summary: `Product ${result.name} was deleted`,
      targetId: result._id.toString(),
      targetLabel: result.name,
      targetType: 'product',
    });
  }

  return result;
};

export const ProductServices = {
  createProductIntoDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductIntoDB,
  deleteSingleProductFromDB,
};
