import express from 'express';
import auth from '../../middlewares/auth.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { USER_ROLE } from '../user/user.constant.js';
import { ReviewControllers } from './review.controller.js';
import { ReviewValidations } from './review.validation.js';

const router = express.Router();

router.post(
  '/create-review',
  auth(USER_ROLE.admin, USER_ROLE.user),
  validateRequest(ReviewValidations.createReviewValidationSchema),
  ReviewControllers.createReview,
);
router.get('/admin', auth(USER_ROLE.admin), ReviewControllers.getAdminReviews);
router.get(
  '/my-reviews',
  auth(USER_ROLE.admin, USER_ROLE.user),
  ReviewControllers.getMyReviews,
);
router.get(
  '/reviewable-products',
  auth(USER_ROLE.admin, USER_ROLE.user),
  ReviewControllers.getReviewableProducts,
);
router.get('/', ReviewControllers.getAllReviews);
router.get('/product/:productId', ReviewControllers.getReviewsByProduct);
router.get('/:id', ReviewControllers.getSingleReview);
router.patch(
  '/:id/visibility',
  auth(USER_ROLE.admin),
  validateRequest(ReviewValidations.updateReviewVisibilityValidationSchema),
  ReviewControllers.updateReviewVisibility,
);
router.patch(
  '/:id',
  auth(USER_ROLE.admin, USER_ROLE.user),
  validateRequest(ReviewValidations.updateReviewValidationSchema),
  ReviewControllers.updateReview,
);
router.delete(
  '/:id',
  auth(USER_ROLE.admin, USER_ROLE.user),
  ReviewControllers.deleteSingleReview,
);

export const ReviewRoutes = router;
