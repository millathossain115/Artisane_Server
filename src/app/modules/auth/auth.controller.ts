import catchAsync from '../../utils/catchAsync.js';
import sendResponse from '../../utils/sendResponse.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import type { TActivityActorRole } from '../activityLog/activityLog.interface.js';
import { AuthServices } from './auth.service.js';

const getActorRole = (role?: string): TActivityActorRole => {
  return role === 'admin' || role === 'super_admin' ? role : 'user';
};

const registerUser = catchAsync(async (req, res) => {
  //console.log('Auth.controller req.body: ', req.body);
  const result = await AuthServices.registerUserIntoDB(req.body);
  await ActivityLogServices.recordActivity({
    ...ActivityLogServices.createActivityContext(req, 'user'),
    action: 'user.registered',
    actorEmail: result.user.email,
    actorId: result.user._id,
    actorName: result.user.name,
    actorRole: getActorRole(result.user.role),
    module: 'auth',
    severity: 'low',
    status: 'success',
    summary: `${result.user.name} registered an account`,
    targetId: result.user._id,
    targetLabel: result.user.email,
    targetType: 'user',
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const loginUser = catchAsync(async (req, res) => {
  //console.log('Auth.login req.body: ', req.body);
  try {
    const result = await AuthServices.loginUser(req.body);

    await ActivityLogServices.recordActivity({
      ...ActivityLogServices.createActivityContext(req, 'user'),
      action: 'user.login',
      actorEmail: result.user.email,
      actorId: result.user._id,
      actorName: result.user.name,
      actorRole: getActorRole(result.user.role),
      module: 'auth',
      severity: 'low',
      status: 'success',
      summary: `${result.user.name} logged in`,
      targetId: result.user._id,
      targetLabel: result.user.email,
      targetType: 'user',
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User logged in successfully',
      data: result,
    });
  } catch (error) {
    await ActivityLogServices.recordActivity({
      ...ActivityLogServices.createActivityContext(req, 'user'),
      action: 'user.login_failed',
      actorEmail:
        typeof req.body.email === 'string' ? req.body.email : undefined,
      actorRole: 'user',
      metadata: { email: req.body.email },
      module: 'auth',
      severity: 'medium',
      status: 'failed',
      summary: `Failed login attempt for ${req.body.email || 'unknown email'}`,
      targetLabel:
        typeof req.body.email === 'string' ? req.body.email : undefined,
      targetType: 'user',
    });
    throw error;
  }
});

const googleLogin = catchAsync(async (req, res) => {
  try {
    const result = await AuthServices.loginWithGoogle(req.body);

    await ActivityLogServices.recordActivity({
      ...ActivityLogServices.createActivityContext(req, 'user'),
      action: 'user.google_login',
      actorEmail: result.user.email,
      actorId: result.user._id,
      actorName: result.user.name,
      actorRole: getActorRole(result.user.role),
      module: 'auth',
      severity: 'low',
      status: 'success',
      summary: `${result.user.name} logged in with Google`,
      targetId: result.user._id,
      targetLabel: result.user.email,
      targetType: 'user',
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'User logged in with Google successfully',
      data: result,
    });
  } catch (error) {
    await ActivityLogServices.recordActivity({
      ...ActivityLogServices.createActivityContext(req, 'user'),
      action: 'user.google_login_failed',
      actorRole: 'user',
      module: 'auth',
      severity: 'medium',
      status: 'failed',
      summary: 'Failed Google login attempt',
      targetType: 'user',
    });
    throw error;
  }
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
    req.file,
    ActivityLogServices.createActivityContext(req),
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
