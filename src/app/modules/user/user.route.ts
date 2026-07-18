import express from 'express';
import auth from '../../middlewares/auth.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { UserControllers } from './user.controller.js';
import { USER_ROLE } from './user.constant.js';
import { UserValidations } from './user.validation.js';

const router = express.Router();

router.post(
  '/create-user',
  auth(USER_ROLE.admin),
  validateRequest(UserValidations.createUserValidationSchema),
  UserControllers.createUser,
);
router.get('/', auth(USER_ROLE.admin), UserControllers.getAllUsers);
router.get('/stats', auth(USER_ROLE.admin), UserControllers.getUserStats);
router.get('/:id', auth(USER_ROLE.admin), UserControllers.getSingleUser);
router.patch(
  '/:id',
  auth(USER_ROLE.admin),
  validateRequest(UserValidations.updateUserValidationSchema),
  UserControllers.updateSingleUser,
);
router.delete('/:id', auth(USER_ROLE.admin), UserControllers.deleteSingleUser);

export const UserRoutes = router;
