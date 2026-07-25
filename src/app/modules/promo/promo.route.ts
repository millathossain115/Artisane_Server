import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import catchAsync from '../../utils/catchAsync.js';
import { USER_ROLE } from '../user/user.constant.js';
import { PromoController } from './promo.controller.js';

const router = Router();

router.get('/active', catchAsync(PromoController.getActivePromoHandler));
router.patch(
  '/',
  auth(USER_ROLE.admin),
  catchAsync(PromoController.updatePromoHandler),
);

export const PromoRoutes = router;
