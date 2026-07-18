import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import type { ICategory } from './category.interface.js';
import { Category } from './category.model.js';

const buildCategoryMatchConditions = (query: Record<string, unknown>) => {
  const searchTerm =
    typeof query.searchTerm === 'string' ? query.searchTerm.trim() : '';
  const slug = typeof query.slug === 'string' ? query.slug.trim() : '';
  const hasImage =
    typeof query.hasImage === 'string' ? query.hasImage.trim() : '';

  const andConditions: Record<string, unknown>[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { slug: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ],
    });
  }

  if (slug) {
    andConditions.push({ slug });
  }

  if (hasImage === 'true') {
    andConditions.push({ image: { $exists: true, $nin: ['', null] } });
  }

  if (hasImage === 'false') {
    andConditions.push({
      $or: [
        { image: { $exists: false } },
        { image: '' },
        { image: null },
      ],
    });
  }

  return andConditions.length > 1 ? { $and: andConditions } : andConditions[0];
};

const buildCategorySortConditions = (query: Record<string, unknown>) => {
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : 'newest';
  const sortOrder =
    typeof query.sortOrder === 'string' ? query.sortOrder : 'desc';
  const direction: 1 | -1 = sortOrder === 'asc' ? 1 : -1;

  if (sortBy === 'name') {
    return { name: direction };
  }

  if (sortBy === 'slug') {
    return { slug: direction };
  }

  return { createdAt: direction };
};

const createCategoryIntoDB = async (payload: ICategory) => {
  const existingCategory = await Category.findOne({
    $or: [{ name: payload.name }, { slug: payload.slug }],
  });

  if (existingCategory) {
    throw new AppError(409, 'Category already exists');
  }

  const result = await Category.create(payload);
  return result;
};

const getAllCategoriesFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const matchConditions = buildCategoryMatchConditions(query);
  const sortConditions = buildCategorySortConditions(query);

  const [total, result] = await Promise.all([
    Category.countDocuments(matchConditions),
    Category.find(matchConditions).sort(sortConditions).skip(skip).limit(limit),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getSingleCategoryFromDB = async (id: string) => {
  const result = await Category.findOne({ _id: id, isDeleted: false });
  return result;
};

const updateCategoryIntoDB = async (
  id: string,
  payload: Partial<ICategory>,
) => {
  if (payload.name || payload.slug) {
    const duplicateConditions: Array<{ name?: string; slug?: string }> = [];

    if (payload.name) {
      duplicateConditions.push({ name: payload.name });
    }

    if (payload.slug) {
      duplicateConditions.push({ slug: payload.slug });
    }

    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      $or: duplicateConditions,
    });

    if (existingCategory) {
      throw new AppError(409, 'Category already exists');
    }
  }

  const result = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    { new: true, runValidators: true },
  );

  return result;
};

const deleteSingleCategoryFromDB = async (id: string) => {
  const result = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );

  return result;
};

export const CategoryServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deleteSingleCategoryFromDB,
};
