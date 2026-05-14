import bcrypt from 'bcrypt';
import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import AppError from '../../errors/appError.js';
import config from '../../config/index.js';
import { USER_STATUS } from '../user/user.constant.js';
import type { TUserStatus } from '../user/user.interface.js';
import { User } from '../user/user.model.js';
import type {
  IAuthResponse,
  IJwtPayload,
  ILoginUser,
  IRegisterUser,
} from './auth.interface.js';

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
  role?: IJwtPayload['role'];
  status?: TUserStatus;
  isDeleted?: boolean;
}) => {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    ...(user.phone ? { phone: user.phone } : {}),
    ...(user.role ? { role: user.role } : {}),
    ...(user.status ? { status: user.status } : {}),
    ...(typeof user.isDeleted === 'boolean'
      ? { isDeleted: user.isDeleted }
      : {}),
  };
};

const registerUserIntoDB = async (
  payload: IRegisterUser,
): Promise<IAuthResponse> => {
  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    throw new AppError(409, 'User already exists with this email');
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds) || 10,
  );

  const createdUser = await User.create({
    ...payload,
    password: hashedPassword,
  });

  const jwtPayload: IJwtPayload = {
    userId: createdUser._id.toString(),
    email: createdUser.email,
    role: createdUser.role || 'user',
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
    user: buildAuthUserResponse(createdUser),
  };
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

export const AuthServices = {
  registerUserIntoDB,
  loginUser,
  getMe,
};
