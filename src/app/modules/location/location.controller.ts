import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { LocationServices } from './location.service.js';

const getDistricts = catchAsync(async (_req, res) => {
  const result = await LocationServices.getDistricts();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Districts retrieved successfully',
    data: result,
  });
});

const getZonesByDistrict = catchAsync(async (req, res) => {
  const { districtId } = req.params;

  if (!districtId || Array.isArray(districtId)) {
    throw new AppError(400, 'District id is required');
  }

  const result = await LocationServices.getZonesByDistrict(districtId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Zones retrieved successfully',
    data: result,
  });
});

export const LocationControllers = {
  getDistricts,
  getZonesByDistrict,
};
