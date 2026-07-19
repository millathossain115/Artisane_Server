import type { TPaymentStatus, TOrderStatus } from '../order/order.interface.js';

export interface IAdminDashboardFilters {
  dateFrom?: string;
  dateTo?: string;
  orderStatus?: TOrderStatus;
  paymentStatus?: TPaymentStatus;
}

export interface IAdminDashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: unknown[];
  orderStatusSummary: unknown[];
  lowStockProducts: unknown[];
  recentUsers: unknown[];
  recentOrders: unknown[];
  recentReviews: unknown[];
  appliedFilters: {
    dateFrom: string | null;
    dateTo: string | null;
    orderStatus: TOrderStatus | null;
    paymentStatus: TPaymentStatus | null;
  };
}

export interface IUserDashboardStats {
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalOrderValue: number;
  totalReviews: number;
  totalWishlistItems: number;
  averageRating: number;
  orderStatusSummary: unknown[];
  recentOrders: unknown[];
  recentReviews: unknown[];
  recentWishlistItems: unknown[];
  appliedFilters: {
    dateFrom: string | null;
    dateTo: string | null;
    orderStatus: TOrderStatus | null;
    paymentStatus: TPaymentStatus | null;
  };
}
