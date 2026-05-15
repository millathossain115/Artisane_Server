import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { CategoryServices } from './category.service.js';

const createCategory = catchAsync(async (req, res) => {
  console.log('Category.create req.body: ', req.body);
  const result = await CategoryServices.createCategoryIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

export const CategoryControllers = {
  createCategory,
};
