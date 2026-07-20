import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { AuthServices } from './auth.service.js';

const registerUser = catchAsync(async (req, res) => {
  //console.log('Auth.controller req.body: ', req.body);
  const result = await AuthServices.registerUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const loginUser = catchAsync(async (req, res) => {
  //console.log('Auth.login req.body: ', req.body);
  const result = await AuthServices.loginUser(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

const googleLogin = catchAsync(async (req, res) => {
  const result = await AuthServices.loginWithGoogle(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User logged in with Google successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req, res) => {
  //console.log('Auth.getMe req.user: ', req.user);
  const result = await AuthServices.getMe(req.user.userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile retrieved successfully',
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req, res) => {
  const result = await AuthServices.updateMyProfileIntoDB(
    req.user.userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User profile updated successfully',
    data: result,
  });
});

export const AuthControllers = {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
  updateMyProfile,
};
