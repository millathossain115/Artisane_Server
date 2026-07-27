import type { TCourierProvider, TOrderStatus, TPaymentMethod, TPaymentStatus } from '../order/order.interface.js';

export interface IAdminAnalyticsFilters {
  category?: string;
  courierProvider?: TCourierProvider;
  dateFrom?: string;
  dateTo?: string;
  orderStatus?: TOrderStatus;
  paymentMethod?: TPaymentMethod;
  paymentStatus?: TPaymentStatus;
}

export interface IAnalyticsNamedCount {
  count: number;
  label: string;
}

export interface IAnalyticsTrendPoint {
  averageOrderValue: number;
  orders: number;
  paidRevenue: number;
  period: string;
  revenue: number;
}

export interface IAdminAnalytics {
  activity: {
    adminActions: number;
    failedLogins: number;
    mostActiveAdmins: Array<{ count: number; email?: string; name?: string }>;
    warningOrFailedEvents: number;
  };
  appliedFilters: Record<string, string | null>;
  customers: {
    highestSpend: Array<{ email?: string; name?: string; orders: number; spend: number }>;
    mostOrders: Array<{ email?: string; name?: string; orders: number; spend: number }>;
    newCustomers: number;
    repeatCustomers: number;
    totalActiveCustomers: number;
    trend: IAnalyticsNamedCount[];
  };
  kpis: {
    averageOrderValue: number;
    conversionProxy: number;
    failedOrRefundedPayments: number;
    newCustomers: number;
    paidRevenue: number;
    repeatCustomers: number;
    totalOrders: number;
    totalRevenue: number;
  };
  orders: {
    cancellationRate: number;
    fulfillmentBacklog: number;
    statusSummary: IAnalyticsNamedCount[];
  };
  payments: {
    failedTrend: IAnalyticsNamedCount[];
    methodSummary: IAnalyticsNamedCount[];
    statusSummary: IAnalyticsNamedCount[];
    successRate: number;
  };
  products: {
    lowStock: Array<{ category?: string; name: string; stock: number }>;
    outOfStock: number;
    slowMoving: Array<{ name: string; soldQuantity: number }>;
    topCategories: Array<{ name: string; revenue: number; soldQuantity: number }>;
    topProducts: Array<{ name: string; revenue: number; soldQuantity: number }>;
  };
  reviews: {
    averageRating: number;
    hiddenReviews: number;
    negativeReviews: Array<{ comment?: string; product?: string; rating: number; user?: string }>;
    ratingSummary: IAnalyticsNamedCount[];
  };
  sales: {
    trend: IAnalyticsTrendPoint[];
  };
  shipping: {
    courierStatusSummary: IAnalyticsNamedCount[];
    delivered: number;
    shipped: number;
    shipmentsCreated: number;
    syncWarnings: number;
  };
}
