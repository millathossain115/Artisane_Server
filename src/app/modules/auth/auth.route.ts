import express from 'express';
import auth from '../../middlewares/auth.js';
import uploadProfileAvatar from '../../middlewares/uploadProfileAvatar.js';
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

router.post(
  '/google',
  validateRequest(AuthValidations.googleAuthValidationSchema),
  AuthControllers.googleLogin,
);

router.post(
  '/forgot-password',
  validateRequest(AuthValidations.forgotPasswordValidationSchema),
  AuthControllers.forgotPassword,
);

router.post(
  '/reset-password',
  validateRequest(AuthValidations.resetPasswordValidationSchema),
  AuthControllers.resetPassword,
);

router.patch(
  '/change-password',
  auth(USER_ROLE.admin, USER_ROLE.user),
  validateRequest(AuthValidations.changePasswordValidationSchema),
  AuthControllers.changePassword,
);

router.get('/me', auth(USER_ROLE.admin, USER_ROLE.user), AuthControllers.getMe);

router.patch(
  '/me',
  auth(USER_ROLE.admin, USER_ROLE.user),
  uploadProfileAvatar.single('avatar'),
  validateRequest(AuthValidations.updateMyProfileValidationSchema),
  AuthControllers.updateMyProfile,
);

export const AuthRoutes = router;
