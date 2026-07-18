import AppError from '../../errors/appError.js';
import config from '../../config/index.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { OrderServices } from './order.service.js';

const getPaymentCallbackPayload = (req: {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
}) => {
  return {
    ...req.query,
    ...req.body,
  };
};

const buildPaymentRedirectUrl = (
  status: 'success' | 'fail' | 'cancel',
  transactionId?: string,
) => {
  const url = new URL(`/payment/${status}`, config.frontend_url);

  if (transactionId) {
    url.searchParams.set('transactionId', transactionId);
  }

  return url.toString();
};

const createOrder = catchAsync(async (req, res) => {
  const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
  const result = await OrderServices.createOrderIntoDB(
    req.user.userId,
    req.body,
    serverBaseUrl,
  );

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Order created successfully',
    data: result,
  });
});

const getMyOrders = catchAsync(async (req, res) => {
  const result = await OrderServices.getMyOrdersFromDB(
    req.user.userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My orders retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getAllOrders = catchAsync(async (req, res) => {
  const result = await OrderServices.getAllOrdersFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Orders retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getSingleOrder = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Order id is required');
  }

  const result = await OrderServices.getSingleOrderFromDB(id);

  if (!result) {
    throw new AppError(404, 'Order not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Order id is required');
  }

  const result = await OrderServices.updateOrderStatusIntoDB(id, req.body);

  if (!result) {
    throw new AppError(404, 'Order not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order updated successfully',
    data: result,
  });
});

const sslcommerzSuccess = catchAsync(async (req, res) => {
  const payload = getPaymentCallbackPayload(req);

  await OrderServices.markOrderAsPaid(payload);

  res.redirect(
    buildPaymentRedirectUrl(
      'success',
      typeof payload.tran_id === 'string' ? payload.tran_id : undefined,
    ),
  );
});

const sslcommerzFail = catchAsync(async (req, res) => {
  const payload = getPaymentCallbackPayload(req);

  await OrderServices.markOrderPaymentFailed(payload);

  res.redirect(
    buildPaymentRedirectUrl(
      'fail',
      typeof payload.tran_id === 'string' ? payload.tran_id : undefined,
    ),
  );
});

const sslcommerzCancel = catchAsync(async (req, res) => {
  const payload = getPaymentCallbackPayload(req);

  await OrderServices.markOrderPaymentFailed(payload);

  res.redirect(
    buildPaymentRedirectUrl(
      'cancel',
      typeof payload.tran_id === 'string' ? payload.tran_id : undefined,
    ),
  );
});

const sslcommerzIpn = catchAsync(async (req, res) => {
  const result = await OrderServices.handleSslcommerzIpn(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'SSLCommerz IPN processed successfully',
    data: result,
  });
});

const cancelOrder = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Order id is required');
  }

  const result = await OrderServices.cancelOrderIntoDB(
    id,
    req.user.userId,
    req.user.role,
  );

  if (!result) {
    throw new AppError(404, 'Order not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order cancelled successfully',
    data: result,
  });
});

const deleteSingleOrder = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Order id is required');
  }

  const result = await OrderServices.deleteSingleOrderFromDB(id);

  if (!result) {
    throw new AppError(404, 'Order not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Order deleted successfully',
    data: result,
  });
});

export const OrderControllers = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getSingleOrder,
  updateOrderStatus,
  sslcommerzSuccess,
  sslcommerzFail,
  sslcommerzCancel,
  sslcommerzIpn,
  cancelOrder,
  deleteSingleOrder,
};
