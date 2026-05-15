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

export const CategoryServices = {
  createCategoryIntoDB,
};
