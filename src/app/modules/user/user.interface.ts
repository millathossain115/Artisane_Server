import { USER_ROLE, USER_STATUS } from './user.constant.js';

export type TUserRole = keyof typeof USER_ROLE;
export type TUserStatus = keyof typeof USER_STATUS;
export type TUserGender = 'female' | 'male' | 'other' | 'prefer_not_to_say';

export interface IUser {
  name: string;
  email: string;
  password?: string;
  passwordChangedAt?: Date;
  passwordResetExpiresAt?: Date;
  passwordResetTokenHash?: string;
  phone?: string;
  alternativePhone?: string;
  dateOfBirth?: Date;
  gender?: TUserGender;
  address?: string;
  city?: string;
  postalCode?: string;
  avatar?: string;
  role?: TUserRole;
  status?: TUserStatus;
  isDeleted?: boolean;
}
