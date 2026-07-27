import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ActivityLogServices } from './activityLog.service.js';

const getActivityLogs = catchAsync(async (req, res) => {
  const result = await ActivityLogServices.getAllActivityLogsFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Activity logs retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

const getActivityLogStats = catchAsync(async (_req, res) => {
  const result = await ActivityLogServices.getActivityLogStatsFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Activity log stats retrieved successfully',
    data: result,
  });
});

const getSingleActivityLog = catchAsync(async (req, res) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'Activity log id is required');
  }

  const result = await ActivityLogServices.getSingleActivityLogFromDB(id);

  if (!result) {
    throw new AppError(404, 'Activity log not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Activity log retrieved successfully',
    data: result,
  });
});

export const ActivityLogControllers = {
  getActivityLogStats,
  getActivityLogs,
  getSingleActivityLog,
};
