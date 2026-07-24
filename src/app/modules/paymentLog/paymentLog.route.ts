import { Router } from 'express';
import auth from '../../middlewares/auth.js';
import { USER_ROLE } from '../user/user.constant.js';
import {
  getPaymentLogByPublicRefHandler,
  getPaymentLogsHandler,
  getPaymentLogStatsHandler,
} from './paymentLog.controller.js';

const router = Router();

router.get('/stats', auth(USER_ROLE.admin), getPaymentLogStatsHandler);
router.get(
  '/:publicRef',
  auth(USER_ROLE.admin),
  getPaymentLogByPublicRefHandler,
);
router.get('/', auth(USER_ROLE.admin), getPaymentLogsHandler);

export const paymentLogRoutes = router;
