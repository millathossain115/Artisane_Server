import express from 'express';
import auth from '../../middlewares/auth.js';
import { USER_ROLE } from '../user/user.constant.js';
import { ActivityLogControllers } from './activityLog.controller.js';

const router = express.Router();

router.get('/stats', auth(USER_ROLE.admin), ActivityLogControllers.getActivityLogStats);
router.get('/:id', auth(USER_ROLE.admin), ActivityLogControllers.getSingleActivityLog);
router.get('/', auth(USER_ROLE.admin), ActivityLogControllers.getActivityLogs);

export const ActivityLogRoutes = router;
