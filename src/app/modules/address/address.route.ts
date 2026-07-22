import express from 'express';
import auth from '../../middlewares/auth.js';
import catchAsync from '../../utils/catchAsync.js';
import { USER_ROLE } from '../user/user.constant.js';
import { AddressController } from './address.controller.js';

const router = express.Router();

router.use(auth(USER_ROLE.user, USER_ROLE.admin));

router.post('/', catchAsync(AddressController.createAddressHandler));
router.get('/my-addresses', catchAsync(AddressController.getMyAddressesHandler));
router.patch('/:id', catchAsync(AddressController.updateAddressHandler));
router.delete('/:id', catchAsync(AddressController.deleteAddressHandler));
router.patch('/:id/set-default', catchAsync(AddressController.setDefaultAddressHandler));

export const AddressRoutes = router;
