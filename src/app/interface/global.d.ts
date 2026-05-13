import { IJwtPayload } from '../modules/auth/auth.interface.js';

declare global {
  namespace Express {
    interface Request {
      user: IJwtPayload;
    }
  }
}
