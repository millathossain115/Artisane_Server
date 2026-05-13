import express from 'express';
import validateRequest from '../../middlewares/validateRequest.js';
import { UserControllers } from './user.controller.js';
import { UserValidations } from './user.validation.js';

const router = express.Router();

router.post(
  '/create-user',
  validateRequest(UserValidations.createUserValidationSchema),
  UserControllers.createUser,
);
router.get('/', UserControllers.getAllUsers);
router.get('/:id', UserControllers.getSingleUser);
router.delete('/:id', UserControllers.deleteSingleUser);

export const UserRoutes = router;
