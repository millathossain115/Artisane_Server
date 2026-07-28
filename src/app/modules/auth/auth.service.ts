import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import type { Express } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import AppError from '../../errors/appError.js';
import config from '../../config/index.js';
import { uploadImageToCloudinary } from '../../utils/cloudinary.js';
import { sendPasswordResetEmail } from '../../utils/email.js';
import { USER_STATUS } from '../user/user.constant.js';
import type { TUserStatus } from '../user/user.interface.js';
import { User } from '../user/user.model.js';
import { UserServices } from '../user/user.service.js';
import { ActivityLogServices } from '../activityLog/activityLog.service.js';
import type { IActivityLogContext } from '../activityLog/activityLog.interface.js';
import type {
  IChangePasswordPayload,
  IAuthResponse,
  IForgotPasswordPayload,
  IGoogleAuthPayload,
  IJwtPayload,
  ILoginUser,
  IRegisterUser,
  IResetPasswordPayload,
  IUpdateMyProfile,
} from './auth.interface.js';

const googleClient = new OAuth2Client();
const PASSWORD_RESET_SUCCESS_MESSAGE =
  'If an account exists, reset instructions were sent.';

const hashPassword = async (password: string) => {
  return bcrypt.hash(password, Number(config.bcrypt_salt_rounds) || 10);
};

const hashResetToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createResetLink = (token: string) => {
  const frontendUrl = config.frontend_url.replace(/\/$/, '');
  return `${frontendUrl}/reset-password?token=${token}`;
};

const createToken = (
  jwtPayload: IJwtPayload,
  secret: Secret,
  expiresIn: NonNullable<SignOptions['expiresIn']>,
) => {
  const jwtOptions: SignOptions = { expiresIn };
  return jwt.sign(jwtPayload, secret, jwtOptions);
};

const buildAuthUserResponse = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  phone?: string;
  alternativePhone?: string;
  dateOfBirth?: Date | string;
  gender?: IUpdateMyProfile['gender'];
  address?: string;
  city?: string;
  postalCode?: string;
  avatar?: string;
  role?: IJwtPayload['role'];
  status?: TUserStatus;
  isDeleted?: boolean;
}) => {
  const dateOfBirth =
    user.dateOfBirth instanceof Date
      ? user.dateOfBirth.toISOString().slice(0, 10)
      : user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().slice(0, 10)
        : undefined;

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.alternativePhone
      ? { alternativePhone: user.alternativePhone }
      : {}),
    ...(dateOfBirth ? { dateOfBirth } : {}),
    ...(user.gender ? { gender: user.gender } : {}),
    ...(user.address ? { address: user.address } : {}),
    ...(user.city ? { city: user.city } : {}),
    ...(user.postalCode ? { postalCode: user.postalCode } : {}),
    ...(user.avatar ? { avatar: user.avatar } : {}),
    ...(user.role ? { role: user.role } : {}),
    ...(user.status ? { status: user.status } : {}),
    ...(typeof user.isDeleted === 'boolean'
      ? { isDeleted: user.isDeleted }
      : {}),
  };
};

const buildAuthResponse = (
  user: Parameters<typeof buildAuthUserResponse>[0],
) => {
  const jwtPayload: IJwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role || 'user',
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as Secret,
    config.jwt_access_expires_in as NonNullable<SignOptions['expiresIn']>,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as Secret,
    config.jwt_refresh_expires_in as NonNullable<SignOptions['expiresIn']>,
  );

  return {
    accessToken,
    refreshToken,
    user: buildAuthUserResponse(user),
  };
};

const registerUserIntoDB = async (
  payload: IRegisterUser,
): Promise<IAuthResponse> => {
  const createdUser = await UserServices.createUserIntoDB(payload);

  return buildAuthResponse(createdUser);
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const user = await User.findOne({
    email: payload.email,
    isDeleted: false,
    status: USER_STATUS.active,
  });

  if (!user) {
    return {
      emailSent: false,
      message: PASSWORD_RESET_SUCCESS_MESSAGE,
    };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const passwordResetTokenHash = hashResetToken(rawToken);
  const passwordResetExpiresAt = new Date(
    Date.now() +
      Math.max(config.password_reset_expires_minutes || 15, 1) * 60 * 1000,
  );

  await User.updateOne(
    { _id: user._id },
    {
      passwordResetExpiresAt,
      passwordResetTokenHash,
    },
  );

  try {
    await sendPasswordResetEmail(
      user.email,
      user.name,
      createResetLink(rawToken),
    );
  } catch (error) {
    await User.updateOne(
      { _id: user._id },
      {
        $unset: {
          passwordResetExpiresAt: '',
          passwordResetTokenHash: '',
        },
      },
    );
    throw error;
  }

  return {
    emailSent: true,
    message: PASSWORD_RESET_SUCCESS_MESSAGE,
    user,
  };
};

const resetPassword = async (payload: IResetPasswordPayload) => {
  const user = await User.findOne({
    isDeleted: false,
    passwordResetExpiresAt: { $gt: new Date() },
    passwordResetTokenHash: hashResetToken(payload.token),
  }).select('+passwordResetExpiresAt +passwordResetTokenHash');

  if (!user) {
    throw new AppError(400, 'Password reset link is invalid or expired');
  }

  if (user.status === USER_STATUS.blocked) {
    throw new AppError(401, 'You are not authorized!');
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        password: await hashPassword(payload.password),
        passwordChangedAt: new Date(),
      },
      $unset: {
        passwordResetExpiresAt: '',
        passwordResetTokenHash: '',
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );

  return updatedUser || user;
};

const changePassword = async (
  userId: string,
  payload: IChangePasswordPayload,
) => {
  const user = await User.findOne({ _id: userId, isDeleted: false }).select(
    '+password',
  );

  if (!user || user.status === USER_STATUS.blocked) {
    throw new AppError(401, 'You are not authorized!');
  }

  if (!user.password) {
    throw new AppError(400, 'Use forgot password to set a password first');
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.currentPassword,
    user.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(401, 'Current password does not match');
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        password: await hashPassword(payload.newPassword),
        passwordChangedAt: new Date(),
      },
      $unset: {
        passwordResetExpiresAt: '',
        passwordResetTokenHash: '',
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );

  return updatedUser || user;
};

const loginUser = async (payload: ILoginUser): Promise<IAuthResponse> => {
  const user = await User.findOne({ email: payload.email }).select('+password');

  if (!user || !user.password) {
    throw new AppError(404, 'User not found');
  }

  if (user.isDeleted || user.status === USER_STATUS.blocked) {
    throw new AppError(401, 'You are not authorized!');
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(401, 'Password does not match');
  }

  return buildAuthResponse(user);
};

const loginWithGoogle = async (
  payload: IGoogleAuthPayload,
): Promise<IAuthResponse> => {
  if (!config.google.client_id) {
    throw new AppError(500, 'GOOGLE_CLIENT_ID is not configured');
  }

  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      audience: config.google.client_id,
      idToken: payload.credential,
    });
  } catch {
    throw new AppError(401, 'Invalid Google credential');
  }

  const googlePayload = ticket.getPayload();

  if (!googlePayload) {
    throw new AppError(401, 'Invalid Google credential');
  }

  const email = googlePayload.email?.toLowerCase();

  if (!email) {
    throw new AppError(400, 'Google account email is required');
  }

  if (!googlePayload.email_verified) {
    throw new AppError(401, 'Google account email is not verified');
  }

  const user = await User.findOne({ email });

  if (user) {
    if (user.isDeleted || user.status === USER_STATUS.blocked) {
      throw new AppError(401, 'You are not authorized!');
    }

    const update: Record<string, unknown> = {};

    if (!user.avatar && googlePayload.picture) {
      update.avatar = googlePayload.picture;
    }

    if (Object.keys(update).length) {
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        update,
        {
          returnDocument: 'after',
          runValidators: true,
        },
      );

      return buildAuthResponse(updatedUser || user);
    }

    return buildAuthResponse(user);
  }

  const createPayload = {
    email,
    name: googlePayload.name || email.split('@')[0] || 'Google User',
    ...(googlePayload.picture ? { avatar: googlePayload.picture } : {}),
  };

  const createdUser = await User.create(createPayload);

  return buildAuthResponse(createdUser);
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.isDeleted || user.status === USER_STATUS.blocked) {
    throw new AppError(401, 'You are not authorized!');
  }

  return buildAuthUserResponse(user);
};

const updateMyProfileIntoDB = async (
  userId: string,
  payload: IUpdateMyProfile,
  avatarFile?: Express.Multer.File,
  activityContext?: IActivityLogContext,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.isDeleted || user.status === USER_STATUS.blocked) {
    throw new AppError(401, 'You are not authorized!');
  }

  const updatePayload = { ...payload };

  if (avatarFile) {
    updatePayload.avatar = await uploadImageToCloudinary(
      avatarFile,
      'artisane/profiles',
    );
  }

  const result = await User.findOneAndUpdate(
    { _id: userId, isDeleted: false },
    updatePayload,
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );

  if (result) {
    await ActivityLogServices.recordActivity({
      ...activityContext,
      action: 'user.profile_updated',
      actorId: userId,
      actorRole: activityContext?.actorRole ?? 'user',
      changes: ActivityLogServices.buildActivityChanges(user, result, [
        'name',
        'email',
        'phone',
        'alternativePhone',
        'dateOfBirth',
        'gender',
        'address',
        'city',
        'postalCode',
        'avatar',
      ]),
      module: 'users',
      severity: 'low',
      source: activityContext?.source ?? 'user',
      status: 'success',
      summary: `${result.name} updated their profile`,
      targetId: userId,
      targetLabel: result.email,
      targetType: 'user',
    });
  }

  return result;
};

export const AuthServices = {
  changePassword,
  forgotPassword,
  registerUserIntoDB,
  loginUser,
  loginWithGoogle,
  resetPassword,
  getMe,
  updateMyProfileIntoDB,
};
