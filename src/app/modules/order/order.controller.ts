import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { OrderServices } from './order.service.js';

const createOrder = catchAsync(async (req, res) => {
  const result = await OrderServices.createOrderIntoDB(
    req.user.userId,
    req.body,
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
  cancelOrder,
  deleteSingleOrder,
};
