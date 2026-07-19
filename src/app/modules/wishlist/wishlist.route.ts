import express from 'express';
import auth from '../../middlewares/auth.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { USER_ROLE } from '../user/user.constant.js';
import { WishlistControllers } from './wishlist.controller.js';
import { WishlistValidations } from './wishlist.validation.js';

const router = express.Router();

router.post(
  '/create-wishlist',
  auth(USER_ROLE.admin, USER_ROLE.user),
  validateRequest(WishlistValidations.createWishlistValidationSchema),
  WishlistControllers.createWishlist,
);

router.get(
  '/my-wishlist',
  auth(USER_ROLE.admin, USER_ROLE.user),
  WishlistControllers.getMyWishlist,
);

router.get(
  '/dashboard',
  auth(USER_ROLE.admin, USER_ROLE.user),
  WishlistControllers.getDashboardWishlist,
);

router.delete(
  '/clear',
  auth(USER_ROLE.admin, USER_ROLE.user),
  WishlistControllers.clearMyWishlist,
);

router.delete(
  '/product/:productId',
  auth(USER_ROLE.admin, USER_ROLE.user),
  WishlistControllers.deleteWishlistByProduct,
);

router.delete(
  '/:id',
  auth(USER_ROLE.admin, USER_ROLE.user),
  WishlistControllers.deleteWishlist,
);

export const WishlistRoutes = router;
