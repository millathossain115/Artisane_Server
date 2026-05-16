import AppError from '../../errors/appError.js';
import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { UserServices } from './user.service.js';

//create user controller
const createUser = catchAsync(async (req, res) => {
  console.log('User.create req.body: ', req.body);
  const result = await UserServices.createUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User created successfully',
    data: result,
  });
});

//get all users controller
const getAllUsers = catchAsync(async (req, res) => {
  console.log('User.getAll req.query: ', req.query);
  const result = await UserServices.getAllUsersFromDB(req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    meta: { ...result.meta },
    data: result.result,
  });
});

//get single user controller
const getSingleUser = catchAsync(async (req, res) => {
  console.log('User.getSingleUser req: ', req);
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'User id is required');
  }

  const result = await UserServices.getSingleUserFromDB(id);

  if (!result) {
    throw new AppError(404, 'User not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: result,
  });
});

//delete single user controller
const deleteSingleUser = catchAsync(async (req, res) => {
  console.log('User.delete req: ', req);
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new AppError(400, 'User id is required');
  }

  const result = await UserServices.deleteSingleUserFromDB(id);

  if (!result) {
    throw new AppError(404, 'User not found');
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
    data: result,
  });
});

export const UserControllers = {
  createUser,
  getAllUsers,
  getSingleUser,
  deleteSingleUser,
};
