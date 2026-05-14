import bcrypt from 'bcrypt';
import config from '../../config/index.js';
import type { IUser } from './user.interface.js';
import { User } from './user.model.js';

const createUserIntoDB = async (payload: IUser) => {
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

const getAllUsersFromDB = async () => {
  const result = await User.find({ isDeleted: false });
  return result;
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
