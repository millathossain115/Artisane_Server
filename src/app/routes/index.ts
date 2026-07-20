import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.route.js';
import { CategoryRoutes } from '../modules/category/category.route.js';
import { DashboardRoutes } from '../modules/dashboard/dashboard.route.js';
import { DeliveryRoutes } from '../modules/delivery/delivery.route.js';
import { LocationRoutes } from '../modules/location/location.route.js';
import { OrderRoutes } from '../modules/order/order.route.js';
import { ProductRoutes } from '../modules/product/product.route.js';
import { ReviewRoutes } from '../modules/review/review.route.js';
import { UserRoutes } from '../modules/user/user.route.js';
import { WishlistRoutes } from '../modules/wishlist/wishlist.route.js';

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
    path: '/dashboard',
    route: DashboardRoutes,
  },
  {
    path: '/delivery',
    route: DeliveryRoutes,
  },
  {
    path: '/products',
    route: ProductRoutes,
  },
  {
    path: '/orders',
    route: OrderRoutes,
  },
  {
    path: '/locations',
    route: LocationRoutes,
  },
  {
    path: '/reviews',
    route: ReviewRoutes,
  },
  {
    path: '/wishlists',
    route: WishlistRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
