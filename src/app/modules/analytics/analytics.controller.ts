import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { AnalyticsServices } from './analytics.service.js';

const getAdminAnalytics = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.getAdminAnalyticsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin analytics retrieved successfully',
    data: result,
  });
});

export const AnalyticsControllers = {
  getAdminAnalytics,
};
