import express from 'express';
import auth from '../../middlewares/auth.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { AuthControllers } from './auth.controller.js';
import { AuthValidations } from './auth.validation.js';
import { USER_ROLE } from '../user/user.constant.js';

const router = express.Router();

router.post(
  '/register',
  validateRequest(AuthValidations.registerUserValidationSchema),
  AuthControllers.registerUser,
);

router.post(
  '/login',
  validateRequest(AuthValidations.loginUserValidationSchema),
  AuthControllers.loginUser,
);

router.get(
  '/me',
  auth(USER_ROLE.admin, USER_ROLE.user),
  AuthControllers.getMe,
);

export const AuthRoutes = router;
