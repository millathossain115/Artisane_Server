import type { Secret } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import AppError from '../errors/appError.js';
import catchAsync from '../utils/catchAsync.js';
import type { IJwtPayload } from '../modules/auth/auth.interface.js';
import { User } from '../modules/user/user.model.js';
import {
  isAdminRole,
  USER_ROLE,
  USER_STATUS,
} from '../modules/user/user.constant.js';
import type { TUserRole } from '../modules/user/user.interface.js';

const auth = (...requiredRoles: TUserRole[]) => {
  return catchAsync(async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      throw new AppError(401, 'You are not authorized!');
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError(401, 'You are not authorized!');
    }

    let decoded: IJwtPayload;

    try {
      decoded = jwt.verify(
        token,
        config.jwt_access_secret as Secret,
      ) as IJwtPayload;
    } catch {
      throw new AppError(401, 'You are not authorized!');
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.isDeleted || user.status === USER_STATUS.blocked) {
      throw new AppError(401, 'You are not authorized!');
    }

    const userRole = user.role || USER_ROLE.user;
    const hasRequiredRole = requiredRoles.some((role) => {
      if (role === USER_ROLE.admin) {
        return isAdminRole(userRole);
      }

      return role === userRole;
    });

    if (requiredRoles.length && !hasRequiredRole) {
      throw new AppError(401, 'You are not authorized!');
    }

    req.user = {
      ...decoded,
      email: user.email,
      role: userRole,
    };
    next();
  });
};

export default auth;
