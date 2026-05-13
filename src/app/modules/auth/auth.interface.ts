export type TUserRole = 'admin' | 'user';

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: TUserRole;
}

export interface ILoginUser {
  email: string;
  password: string;
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
    role?: TUserRole;
  };
}
