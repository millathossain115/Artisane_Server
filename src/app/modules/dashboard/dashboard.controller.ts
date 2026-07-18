import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { DashboardServices } from './dashboard.service.js';

const getAdminStats = catchAsync(async (req, res) => {
  const result = await DashboardServices.getAdminStatsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin dashboard stats retrieved successfully',
    data: result,
  });
});

const getUserStats = catchAsync(async (req, res) => {
  const result = await DashboardServices.getUserStatsFromDB(
    req.user.userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User dashboard stats retrieved successfully',
    data: result,
  });
});

export const DashboardControllers = {
  getAdminStats,
  getUserStats,
};
