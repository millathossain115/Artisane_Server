import express from 'express';
import auth from '../../middlewares/auth.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { USER_ROLE } from '../user/user.constant.js';
import { CategoryControllers } from './category.controller.js';
import { CategoryValidations } from './category.validation.js';

const router = express.Router();

router.post(
  '/create-category',
  auth(USER_ROLE.admin),
  validateRequest(CategoryValidations.createCategoryValidationSchema),
  CategoryControllers.createCategory,
);
router.get('/', CategoryControllers.getAllCategories);
router.get('/:id', CategoryControllers.getSingleCategory);
router.patch(
  '/:id',
  auth(USER_ROLE.admin),
  validateRequest(CategoryValidations.updateCategoryValidationSchema),
  CategoryControllers.updateCategory,
);
router.delete(
  '/:id',
  auth(USER_ROLE.admin),
  CategoryControllers.deleteSingleCategory,
);

export const CategoryRoutes = router;
