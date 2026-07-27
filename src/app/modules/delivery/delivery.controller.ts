import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import { DeliveryServices } from './delivery.service.js';

const steadfastWebhook = catchAsync(async (req, res) => {
  const result = await DeliveryServices.handleSteadfastWebhook(
    req.body,
    req.headers['x-steadfast-signature'],
    ActivityLogServices.createActivityContext(req, 'courier_webhook'),
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
