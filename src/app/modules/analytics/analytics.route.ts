import express from 'express';
import auth from '../../middlewares/auth.js';
import { USER_ROLE } from '../user/user.constant.js';
import { AnalyticsControllers } from './analytics.controller.js';

const router = express.Router();

router.get('/admin', auth(USER_ROLE.admin), AnalyticsControllers.getAdminAnalytics);

export const AnalyticsRoutes = router;
