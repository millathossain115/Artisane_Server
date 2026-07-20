import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { DeliveryServices } from './delivery.service.js';

const steadfastWebhook = catchAsync(async (req, res) => {
  const result = await DeliveryServices.handleSteadfastWebhook(
    req.body,
    req.headers['x-steadfast-signature'],
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Steadfast webhook processed successfully',
    data: result,
  });
});

export const DeliveryControllers = {
  steadfastWebhook,
};
