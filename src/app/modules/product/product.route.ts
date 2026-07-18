import express from 'express';
import auth from '../../middlewares/auth.js';
import uploadProductImages from '../../middlewares/uploadProductImages.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { USER_ROLE } from '../user/user.constant.js';
import { ProductControllers } from './product.controller.js';
import { ProductValidations } from './product.validation.js';

const router = express.Router();

router.post(
  '/create-product',
  auth(USER_ROLE.admin),
  uploadProductImages.array('images', 5),
  validateRequest(ProductValidations.createProductValidationSchema),
  ProductControllers.createProduct,
);
router.get('/', ProductControllers.getAllProducts);
router.get('/:id', ProductControllers.getSingleProduct);
router.patch(
  '/:id',
  auth(USER_ROLE.admin),
  uploadProductImages.array('images', 5),
  validateRequest(ProductValidations.updateProductValidationSchema),
  ProductControllers.updateProduct,
);
router.delete(
  '/:id',
  auth(USER_ROLE.admin),
  ProductControllers.deleteSingleProduct,
);

export const ProductRoutes = router;
