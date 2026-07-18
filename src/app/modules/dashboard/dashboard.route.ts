import express from 'express';
import auth from '../../middlewares/auth.js';
import { USER_ROLE } from '../user/user.constant.js';
import { DashboardControllers } from './dashboard.controller.js';

const router = express.Router();

router.get(
  '/admin-stats',
  auth(USER_ROLE.admin),
  DashboardControllers.getAdminStats,
);

router.get(
  '/my-stats',
  auth(USER_ROLE.admin, USER_ROLE.user),
  DashboardControllers.getUserStats,
);

export const DashboardRoutes = router;
