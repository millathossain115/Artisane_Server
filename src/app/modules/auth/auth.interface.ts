import type { TUserRole, TUserStatus } from '../user/user.interface.js';

export type { TUserRole, TUserStatus };

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: TUserRole;
}

export interface IUpdateMyProfile {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  avatar?: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IGoogleAuthPayload {
  credential: string;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: TUserRole;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    avatar?: string;
    role?: TUserRole;
    status?: TUserStatus;
    isDeleted?: boolean;
  };
}
