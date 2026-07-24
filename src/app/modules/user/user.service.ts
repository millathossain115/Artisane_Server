import bcrypt from 'bcrypt';
import config from '../../config/index.js';
import AppError from '../../errors/appError.js';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import { USER_ROLE, USER_STATUS } from './user.constant.js';
import type { IUser } from './user.interface.js';
import { User } from './user.model.js';

const VALID_USER_ROLES = new Set(Object.keys(USER_ROLE));
const VALID_USER_STATUSES = new Set(Object.keys(USER_STATUS));

const buildUserMatchConditions = (
  query: Record<string, unknown>,
): Record<string, unknown> => {
  const searchTerm =
    typeof query.searchTerm === 'string' ? query.searchTerm.trim() : '';
  const role = typeof query.role === 'string' ? query.role.trim() : '';
  const status = typeof query.status === 'string' ? query.status.trim() : '';
  const city = typeof query.city === 'string' ? query.city.trim() : '';
  const hasPhone =
    typeof query.hasPhone === 'string' ? query.hasPhone.trim() : '';

  const andConditions: Record<string, unknown>[] = [{ isDeleted: false }];

  if (searchTerm) {
    andConditions.push({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { city: { $regex: searchTerm, $options: 'i' } },
      ],
    });
  }

  if (VALID_USER_ROLES.has(role)) {
    andConditions.push({ role });
  }

  if (VALID_USER_STATUSES.has(status)) {
    andConditions.push({ status });
  }

  if (city) {
    andConditions.push({ city: { $regex: city, $options: 'i' } });
  }

  if (hasPhone === 'true') {
    andConditions.push({ phone: { $exists: true, $nin: ['', null] } });
  }

  if (hasPhone === 'false') {
    andConditions.push({
      $or: [{ phone: { $exists: false } }, { phone: '' }, { phone: null }],
    });
  }

  return andConditions.length > 1
    ? { $and: andConditions }
    : { isDeleted: false };
};

const buildUserSortConditions = (query: Record<string, unknown>) => {
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : 'newest';
  const sortOrder =
    typeof query.sortOrder === 'string' ? query.sortOrder : 'desc';
  const direction: 1 | -1 = sortOrder === 'asc' ? 1 : -1;

  if (sortBy === 'name') {
    return { name: direction };
  }

  if (sortBy === 'email') {
    return { email: direction };
  }

  return { createdAt: direction };
};

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
  const matchConditions = buildUserMatchConditions(query);
  const sortConditions = buildUserSortConditions(query);

  const [total, result] = await Promise.all([
    User.countDocuments(matchConditions),
    User.find(matchConditions).sort(sortConditions).skip(skip).limit(limit),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getUserStatsFromDB = async (query: Record<string, unknown>) => {
  const matchConditions = buildUserMatchConditions(query);

  const [
    totalUsers,
    totalAdmins,
    activeUsers,
    blockedUsers,
    roleSummary,
    statusSummary,
  ] = await Promise.all([
    User.countDocuments(matchConditions),
    User.countDocuments({
      ...matchConditions,
      role: USER_ROLE.admin,
    }),
    User.countDocuments({
      ...matchConditions,
      status: USER_STATUS.active,
    }),
    User.countDocuments({
      ...matchConditions,
      status: USER_STATUS.blocked,
    }),
    User.aggregate([
      { $match: matchConditions },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: matchConditions },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    totalUsers,
    totalAdmins,
    totalCustomers: totalUsers - totalAdmins,
    activeUsers,
    blockedUsers,
    roleSummary,
    statusSummary,
  };
};

const getSingleUserFromDB = async (id: string) => {
  const result = await User.findOne({ _id: id, isDeleted: false });
  return result;
};

const updateUserIntoDB = async (id: string, payload: Partial<IUser>) => {
  if (payload.email) {
    const existingUser = await User.findOne({
      _id: { $ne: id },
      email: payload.email,
      isDeleted: false,
    });

    if (existingUser) {
      throw new AppError(409, 'User already exists with this email');
    }
  }

  const result = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    payload,
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );

  return result;
};

const deleteSingleUserFromDB = async (id: string) => {
  const result = await User.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true },
    { returnDocument: 'after' },
  );

  return result;
};

export const UserServices = {
  createUserIntoDB,
  getAllUsersFromDB,
  getUserStatsFromDB,
  getSingleUserFromDB,
  updateUserIntoDB,
  deleteSingleUserFromDB,
};
