import type { IUser } from './user.interface.js';
import { User } from './user.model.js';

const createUserIntoDB = async (payload: IUser) => {
  const result = await User.create(payload);
  return result;
};

const getAllUsersFromDB = async () => {
  const result = await User.find();
  return result;
};

const getSingleUserFromDB = async (id: string) => {
  const result = await User.findById(id);
  return result;
};

const deleteSingleUserFromDB = async (id: string) => {
  const result = await User.findByIdAndDelete(id);
  return result;
};

export const UserServices = {
  createUserIntoDB,
  getAllUsersFromDB,
  getSingleUserFromDB,
  deleteSingleUserFromDB,
};
