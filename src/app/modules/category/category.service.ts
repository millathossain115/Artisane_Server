import AppError from '../../errors/appError.js';
import type { ICategory } from './category.interface.js';
import { Category } from './category.model.js';

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

const getAllCategoriesFromDB = async () => {
  const result = await Category.find({ isDeleted: false });
  return result;
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
