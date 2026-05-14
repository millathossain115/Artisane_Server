import { USER_ROLE, USER_STATUS } from './user.constant.js';

export type TUserRole = keyof typeof USER_ROLE;
export type TUserStatus = keyof typeof USER_STATUS;

export interface IUser {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: TUserRole;
  status?: TUserStatus;
  isDeleted?: boolean;
}
