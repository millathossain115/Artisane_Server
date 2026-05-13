import express from 'express';
import validateRequest from '../../middlewares/validateRequest.js';
import { AuthControllers } from './auth.controller.js';
import { AuthValidations } from './auth.validation.js';

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

export const AuthRoutes = router;
