import express from 'express';
import auth from '../../middlewares/auth.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { USER_ROLE } from '../user/user.constant.js';
import { OrderControllers } from './order.controller.js';
import { OrderValidations } from './order.validation.js';

const router = express.Router();

router.post(
  '/create-order',
  auth(USER_ROLE.admin, USER_ROLE.user),
  validateRequest(OrderValidations.createOrderValidationSchema),
  OrderControllers.createOrder,
);
router.get(
  '/my-orders',
  auth(USER_ROLE.admin, USER_ROLE.user),
  OrderControllers.getMyOrders,
);
router.post('/payment/success', OrderControllers.sslcommerzSuccess);
router.get('/payment/success', OrderControllers.sslcommerzSuccess);
router.post('/payment/fail', OrderControllers.sslcommerzFail);
router.get('/payment/fail', OrderControllers.sslcommerzFail);
router.post('/payment/cancel', OrderControllers.sslcommerzCancel);
router.get('/payment/cancel', OrderControllers.sslcommerzCancel);
router.post('/payment/ipn', OrderControllers.sslcommerzIpn);
router.get('/', auth(USER_ROLE.admin), OrderControllers.getAllOrders);
router.get('/:id', auth(USER_ROLE.admin), OrderControllers.getSingleOrder);
router.patch(
  '/:id/status',
  auth(USER_ROLE.admin),
  validateRequest(OrderValidations.updateOrderStatusValidationSchema),
  OrderControllers.updateOrderStatus,
);
router.patch(
  '/:id/cancel',
  auth(USER_ROLE.admin, USER_ROLE.user),
  OrderControllers.cancelOrder,
);
router.delete(
  '/:id',
  auth(USER_ROLE.admin),
  OrderControllers.deleteSingleOrder,
);

export const OrderRoutes = router;
