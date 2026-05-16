import { Types } from 'mongoose';
import AppError from '../../errors/appError.js';
import { Category } from '../category/category.model.js';
import type { IProduct } from './product.interface.js';
import { Product } from './product.model.js';

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
  const searchTerm =
    typeof query.searchTerm === 'string' ? query.searchTerm.trim() : '';
  const category =
    typeof query.category === 'string' ? query.category.trim() : '';
  const minPrice =
    typeof query.minPrice === 'string' ? Number(query.minPrice) : undefined;
  const maxPrice =
    typeof query.maxPrice === 'string' ? Number(query.maxPrice) : undefined;
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : 'newest';
  const sortOrder =
    typeof query.sortOrder === 'string' ? query.sortOrder : 'desc';

  const matchStage: Record<string, unknown> = {
    isDeleted: false,
  };

  if (searchTerm) {
    matchStage.name = {
      $regex: searchTerm,
      $options: 'i',
    };
  }

  if (category && Types.ObjectId.isValid(category)) {
    matchStage.category = new Types.ObjectId(category);
  }

  if (
    typeof minPrice === 'number' &&
    !Number.isNaN(minPrice) &&
    typeof maxPrice === 'number' &&
    !Number.isNaN(maxPrice)
  ) {
    matchStage.price = { $gte: minPrice, $lte: maxPrice };
  } else if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
    matchStage.price = { $gte: minPrice };
  } else if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
    matchStage.price = { $lte: maxPrice };
  }

  const sortStage: Record<string, 1 | -1> = { createdAt: -1 };

  if (sortBy === 'price') {
    sortStage.price = sortOrder === 'asc' ? 1 : -1;
    delete sortStage.createdAt;
  }

  if (sortBy === 'rating') {
    sortStage.averageRating = sortOrder === 'asc' ? 1 : -1;
    delete sortStage.createdAt;
  }

  if (sortBy === 'newest') {
    sortStage.createdAt = sortOrder === 'asc' ? 1 : -1;
  }

  const result = await Product.aggregate([
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'reviews',
        let: { productId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$product', '$$productId'] },
                  { $eq: ['$isDeleted', false] },
                ],
              },
            },
          },
        ],
        as: 'reviews',
      },
    },
    {
      $addFields: {
        averageRating: {
          $ifNull: [{ $avg: '$reviews.rating' }, 0],
        },
        reviewCount: {
          $size: '$reviews',
        },
        category: {
          _id: '$category._id',
          name: '$category.name',
          slug: '$category.slug',
        },
      },
    },
    {
      $project: {
        reviews: 0,
      },
    },
    {
      $sort: sortStage,
    },
  ]);

  return result;
};

const getSingleProductFromDB = async (id: string) => {
  const result = await Product.findOne({ _id: id, isDeleted: false }).populate(
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
