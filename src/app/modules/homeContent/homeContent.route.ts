import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import catchAsync from '../../utils/catchAsync.js';
import uploadHomeHeroImages from '../../middlewares/uploadHomeHeroImages.js';
import { USER_ROLE } from '../user/user.constant.js';
import { HomeContentControllers } from './homeContent.controller.js';

const router = Router();

router.get('/hero', catchAsync(HomeContentControllers.getHomeHeroHandler));
router.patch(
  '/hero',
  auth(USER_ROLE.admin),
  uploadHomeHeroImages.any(),
  catchAsync(HomeContentControllers.updateHomeHeroHandler),
);

export const HomeContentRoutes = router;
