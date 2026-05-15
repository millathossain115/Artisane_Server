import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.route.js';
import { CategoryRoutes } from '../modules/category/category.route.js';
import { ProductRoutes } from '../modules/product/product.route.js';
import { UserRoutes } from '../modules/user/user.route.js';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/categories',
    route: CategoryRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
