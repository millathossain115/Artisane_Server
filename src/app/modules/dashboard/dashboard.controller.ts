import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { DashboardServices } from './dashboard.service.js';

const getAdminStats = catchAsync(async (_req, res) => {
  const result = await DashboardServices.getAdminStatsFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin dashboard stats retrieved successfully',
    data: result,
  });
});

export const DashboardControllers = {
  getAdminStats,
};
