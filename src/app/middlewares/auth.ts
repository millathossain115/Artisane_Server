import type { Secret } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import AppError from '../errors/appError.js';
import catchAsync from '../utils/catchAsync.js';
import type { IJwtPayload, TUserRole } from '../modules/auth/auth.interface.js';

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req, res, next) => {
    const token = req.headers.authorization;

    // checking if the token is missing
    if (!token) {
      throw new AppError(401, 'You are not authorized!');
    }

    // checking if the given token is valid
    const decoded = jwt.verify(
      token,
      config.jwt_access_secret as Secret,
    ) as IJwtPayload;

    const { role } = decoded;

    // check if the user is authorized or not
    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new AppError(401, 'You are not authorized!');
    }

    req.user = decoded;
    next();
  });
};

export default auth;
