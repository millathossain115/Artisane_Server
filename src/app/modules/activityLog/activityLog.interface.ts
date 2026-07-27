export type TActivityActorRole = 'admin' | 'super_admin' | 'system' | 'user';

export type TActivitySource =
  | 'admin'
  | 'courier_webhook'
  | 'payment_gateway'
  | 'scheduler'
  | 'system'
  | 'user';

export type TActivityModule =
  | 'auth'
  | 'categories'
  | 'home_content'
  | 'orders'
  | 'payments'
  | 'products'
  | 'promo'
  | 'reviews'
  | 'shipping'
  | 'users'
  | 'wishlist';

export type TActivityStatus = 'failed' | 'success' | 'warning';

export type TActivitySeverity = 'high' | 'low' | 'medium';

export type TDeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

export interface IActivityChange {
  after?: unknown;
  before?: unknown;
  field: string;
}

export interface IActivityLog {
  actorEmail?: string | undefined;
  actorId?: string | undefined;
  actorName?: string | undefined;
  actorRole: TActivityActorRole;
  action: string;
  browser?: string | undefined;
  changes?: IActivityChange[] | undefined;
  deviceType?: TDeviceType | undefined;
  ipAddress?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  module: TActivityModule;
  os?: string | undefined;
  severity: TActivitySeverity;
  source: TActivitySource;
  status: TActivityStatus;
  summary: string;
  targetId?: string | undefined;
  targetLabel?: string | undefined;
  targetType?: string | undefined;
  userAgent?: string | undefined;
}

export interface IActivityLogContext {
  actorEmail?: string | undefined;
  actorId?: string | undefined;
  actorName?: string | undefined;
  actorRole?: TActivityActorRole | undefined;
  ipAddress?: string | undefined;
  source?: TActivitySource | undefined;
  userAgent?: string | undefined;
}

export type TRecordActivityPayload = Omit<
  IActivityLog,
  | 'actorRole'
  | 'browser'
  | 'deviceType'
  | 'ipAddress'
  | 'os'
  | 'source'
  | 'userAgent'
> & {
  actorEmail?: string | undefined;
  actorId?: string | undefined;
  actorName?: string | undefined;
  actorRole?: TActivityActorRole | undefined;
  ipAddress?: string | undefined;
  source?: TActivitySource | undefined;
  userAgent?: string | undefined;
};
