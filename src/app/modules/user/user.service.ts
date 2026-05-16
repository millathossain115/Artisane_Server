import bcrypt from 'bcrypt';
import config from '../../config/index.js';
import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import type { IUser } from './user.interface.js';
import { User } from './user.model.js';

const createUserIntoDB = async (payload: IUser) => {
  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    throw new AppError(409, 'User already exists with this email');
  }

  const createPayload = { ...payload };

  if (payload.password) {
    createPayload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_rounds) || 10,
    );
  }

  const result = await User.create(createPayload);
  return result;
};

const getAllUsersFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const [total, result] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getSingleUserFromDB = async (id: string) => {
  const result = await User.findOne({ _id: id, isDeleted: false });
  return result;
};

const deleteSingleUserFromDB = async (id: string) => {
  const result = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { new: true },
  );

  return result;
};

export const UserServices = {
  createUserIntoDB,
  getAllUsersFromDB,
  getSingleUserFromDB,
  deleteSingleUserFromDB,
};
