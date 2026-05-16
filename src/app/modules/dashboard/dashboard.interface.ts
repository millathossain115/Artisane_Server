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
}
