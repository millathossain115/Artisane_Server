import { Router } from 'express';
import { PromoController } from './promo.controller.js';
import auth from '../../middlewares/auth.js';
import { USER_ROLE } from '../user/user.constant.js';
import catchAsync from '../../utils/catchAsync.js';

const router = Router();

router.get('/active', catchAsync(PromoController.getActivePromoHandler));
router.patch(
  '/',
  auth(USER_ROLE.admin),
  catchAsync(PromoController.updatePromoHandler)
);

export const PromoRoutes = router;
