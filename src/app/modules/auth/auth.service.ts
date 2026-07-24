import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import AppError from '../../errors/appError.js';
import config from '../../config/index.js';
import { USER_STATUS } from '../user/user.constant.js';
import type { TUserStatus } from '../user/user.interface.js';
import { User } from '../user/user.model.js';
import { UserServices } from '../user/user.service.js';
import type {
  IAuthResponse,
  IGoogleAuthPayload,
  IJwtPayload,
  ILoginUser,
  IRegisterUser,
  IUpdateMyProfile,
} from './auth.interface.js';

const googleClient = new OAuth2Client();

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
  address?: string;
  city?: string;
  postalCode?: string;
  avatar?: string;
  role?: IJwtPayload['role'];
  status?: TUserStatus;
  isDeleted?: boolean;
}) => {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
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

  return user;
};

const updateMyProfileIntoDB = async (
  userId: string,
  payload: IUpdateMyProfile,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  if (user.isDeleted || user.status === USER_STATUS.blocked) {
    throw new AppError(401, 'You are not authorized!');
  }

  const result = await User.findOneAndUpdate(
    { _id: userId, isDeleted: false },
    payload,
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );

  return result;
};

export const AuthServices = {
  registerUserIntoDB,
  loginUser,
  loginWithGoogle,
  getMe,
  updateMyProfileIntoDB,
};
