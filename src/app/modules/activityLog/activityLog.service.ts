import type { Request } from 'express';
import {
  buildPaginationMeta,
  calculatePagination,
} from '../../utils/pagination.js';
import { isAdminRole, USER_ROLE } from '../user/user.constant.js';
import { User } from '../user/user.model.js';
import { ActivityLog } from './activityLog.model.js';
import type {
  IActivityChange,
  IActivityLogContext,
  TActivityActorRole,
  TActivityModule,
  TActivitySeverity,
  TActivitySource,
  TActivityStatus,
  TDeviceType,
  TRecordActivityPayload,
} from './activityLog.interface.js';

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|authorization|credential|store_passwd|api[_-]?key|jwt|card|session/i;

const ALLOWED_MODULES = new Set<TActivityModule>([
  'auth',
  'categories',
  'home_content',
  'orders',
  'payments',
  'products',
  'promo',
  'reviews',
  'shipping',
  'users',
  'wishlist',
]);

const ALLOWED_SOURCES = new Set<TActivitySource>([
  'admin',
  'courier_webhook',
  'payment_gateway',
  'scheduler',
  'system',
  'user',
]);

const ALLOWED_STATUSES = new Set<TActivityStatus>([
  'failed',
  'success',
  'warning',
]);

const ALLOWED_SEVERITIES = new Set<TActivitySeverity>([
  'high',
  'low',
  'medium',
]);

const ALLOWED_ACTOR_ROLES = new Set<TActivityActorRole>([
  'admin',
  'super_admin',
  'system',
  'user',
]);

const getRequestUser = (req: Request) => {
  return (req as Request & { user?: Request['user'] }).user;
};

const getForwardedIp = (req: Request) => {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim();
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0].split(',')[0]?.trim();
  }

  return req.ip || req.socket.remoteAddress;
};

export const createActivityContext = (
  req: Request,
  source?: TActivitySource,
): IActivityLogContext => {
  const user = getRequestUser(req);
  const userAgent = req.headers['user-agent'];
  const actorRole = user?.role;

  return {
    ...(user?.email ? { actorEmail: user.email } : {}),
    ...(user?.userId ? { actorId: user.userId } : {}),
    ...(actorRole ? { actorRole } : {}),
    ...(getForwardedIp(req) ? { ipAddress: getForwardedIp(req) } : {}),
    source:
      source ??
      (isAdminRole(user?.role) ? 'admin' : user?.role ? 'user' : 'system'),
    ...(typeof userAgent === 'string' ? { userAgent } : {}),
  };
};

const detectDeviceType = (userAgent = ''): TDeviceType => {
  const value = userAgent.toLowerCase();

  if (!value) {
    return 'unknown';
  }

  if (/ipad|tablet|kindle|silk/.test(value)) {
    return 'tablet';
  }

  if (/mobile|iphone|ipod|android.*mobile|windows phone/.test(value)) {
    return 'mobile';
  }

  if (/mozilla|chrome|safari|firefox|edg|opr/.test(value)) {
    return 'desktop';
  }

  return 'unknown';
};

const detectBrowser = (userAgent = '') => {
  if (/Edg\//.test(userAgent)) return 'Edge';
  if (/OPR\//.test(userAgent)) return 'Opera';
  if (/Chrome\//.test(userAgent)) return 'Chrome';
  if (/Firefox\//.test(userAgent)) return 'Firefox';
  if (/Safari\//.test(userAgent)) return 'Safari';
  return userAgent ? 'Other' : undefined;
};

const detectOs = (userAgent = '') => {
  if (/Windows NT/.test(userAgent)) return 'Windows';
  if (/Android/.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Mac OS X/.test(userAgent)) return 'macOS';
  if (/Linux/.test(userAgent)) return 'Linux';
  return userAgent ? 'Other' : undefined;
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const sanitizeActivityValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeActivityValue);
  }

  if (!isPlainRecord(value)) {
    return value;
  }

  return Object.entries(value).reduce<Record<string, unknown>>(
    (sanitized, [key, item]) => {
      sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
        ? '[REDACTED]'
        : sanitizeActivityValue(item);
      return sanitized;
    },
    {},
  );
};

const normalizeDocument = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && 'toObject' in value) {
    return (value as { toObject: () => Record<string, unknown> }).toObject();
  }

  return isPlainRecord(value) ? value : {};
};

const getComparableValue = (value: unknown) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === 'object' && 'toString' in value) {
    const constructorName = value.constructor?.name;

    if (constructorName === 'ObjectId') {
      return value.toString();
    }
  }

  return value;
};

export const buildActivityChanges = (
  before: unknown,
  after: unknown,
  fields: string[],
): IActivityChange[] => {
  const beforeRecord = normalizeDocument(before);
  const afterRecord = normalizeDocument(after);

  return fields.reduce<IActivityChange[]>((changes, field) => {
    const beforeValue = sanitizeActivityValue(
      getComparableValue(beforeRecord[field]),
    );
    const afterValue = sanitizeActivityValue(
      getComparableValue(afterRecord[field]),
    );

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes.push({
        after: afterValue,
        before: beforeValue,
        field,
      });
    }

    return changes;
  }, []);
};

const enrichActor = async (payload: TRecordActivityPayload) => {
  if (!payload.actorId || (payload.actorName && payload.actorEmail)) {
    return payload;
  }

  const user = await User.findById(payload.actorId).select('name email role');

  if (!user) {
    return payload;
  }

  return {
    ...payload,
    actorEmail: payload.actorEmail ?? user.email,
    actorName: payload.actorName ?? user.name,
    actorRole: payload.actorRole ?? user.role ?? 'user',
  };
};

const recordActivity = async (payload: TRecordActivityPayload) => {
  try {
    const enrichedPayload = await enrichActor(payload);
    const userAgent = enrichedPayload.userAgent;

    await ActivityLog.create({
      ...enrichedPayload,
      actorRole: enrichedPayload.actorRole ?? 'system',
      browser: detectBrowser(userAgent),
      changes: sanitizeActivityValue(
        enrichedPayload.changes ?? [],
      ) as IActivityChange[],
      deviceType: detectDeviceType(userAgent),
      metadata: sanitizeActivityValue(enrichedPayload.metadata) as
        | Record<string, unknown>
        | undefined,
      os: detectOs(userAgent),
      severity: enrichedPayload.severity ?? 'low',
      source: enrichedPayload.source ?? 'system',
      status: enrichedPayload.status ?? 'success',
    });
  } catch (error) {
    console.error('Activity log write failed:', error);
  }
};

const buildActivityLogFilter = (query: Record<string, unknown>) => {
  const filter: Record<string, unknown> = {};

  const exactFilters = [
    ['module', ALLOWED_MODULES],
    ['source', ALLOWED_SOURCES],
    ['status', ALLOWED_STATUSES],
    ['severity', ALLOWED_SEVERITIES],
    ['actorRole', ALLOWED_ACTOR_ROLES],
  ] as const;

  exactFilters.forEach(([key, allowedValues]) => {
    const value = typeof query[key] === 'string' ? query[key].trim() : '';

    if (allowedValues.has(value as never)) {
      filter[key] = value;
    }
  });

  ['action', 'actorId', 'targetType', 'targetId'].forEach((key) => {
    const value = typeof query[key] === 'string' ? query[key].trim() : '';

    if (value) {
      filter[key] = value;
    }
  });

  const dateFrom =
    typeof query.dateFrom === 'string' ? new Date(query.dateFrom) : null;
  const dateTo =
    typeof query.dateTo === 'string' ? new Date(query.dateTo) : null;

  if (
    (dateFrom && !Number.isNaN(dateFrom.getTime())) ||
    (dateTo && !Number.isNaN(dateTo.getTime()))
  ) {
    filter.createdAt = {
      ...(dateFrom && !Number.isNaN(dateFrom.getTime())
        ? { $gte: dateFrom }
        : {}),
      ...(dateTo && !Number.isNaN(dateTo.getTime()) ? { $lte: dateTo } : {}),
    };
  }

  const searchTerm =
    typeof query.searchTerm === 'string' ? query.searchTerm.trim() : '';

  if (searchTerm) {
    filter.$or = [
      { action: { $regex: searchTerm, $options: 'i' } },
      { actorEmail: { $regex: searchTerm, $options: 'i' } },
      { actorName: { $regex: searchTerm, $options: 'i' } },
      { summary: { $regex: searchTerm, $options: 'i' } },
      { targetLabel: { $regex: searchTerm, $options: 'i' } },
      { targetId: { $regex: searchTerm, $options: 'i' } },
      { ipAddress: { $regex: searchTerm, $options: 'i' } },
    ];
  }

  return filter;
};

const getAllActivityLogsFromDB = async (query: Record<string, unknown>) => {
  const { page, limit, skip } = calculatePagination(query);
  const filter = buildActivityLogFilter(query);
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const [total, result] = await Promise.all([
    ActivityLog.countDocuments(filter),
    ActivityLog.find(filter)
      .sort({ createdAt: sortOrder })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    meta: buildPaginationMeta(page, limit, total),
    result,
  };
};

const getSingleActivityLogFromDB = async (id: string) => {
  return ActivityLog.findById(id);
};

const getActivityLogStatsFromDB = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalLogs,
    todayLogs,
    failedLogs,
    warningLogs,
    adminLogs,
    userLogs,
    systemLogs,
    moduleSummary,
  ] = await Promise.all([
    ActivityLog.countDocuments(),
    ActivityLog.countDocuments({ createdAt: { $gte: today } }),
    ActivityLog.countDocuments({ status: 'failed' }),
    ActivityLog.countDocuments({ status: 'warning' }),
    ActivityLog.countDocuments({
      actorRole: { $in: [USER_ROLE.admin, USER_ROLE.super_admin] },
    }),
    ActivityLog.countDocuments({ actorRole: 'user' }),
    ActivityLog.countDocuments({ actorRole: 'system' }),
    ActivityLog.aggregate([
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    adminLogs,
    failedLogs,
    moduleSummary,
    systemLogs,
    todayLogs,
    totalLogs,
    userLogs,
    warningLogs,
  };
};

export const ActivityLogServices = {
  buildActivityChanges,
  createActivityContext,
  getActivityLogStatsFromDB,
  getAllActivityLogsFromDB,
  getSingleActivityLogFromDB,
  recordActivity,
  sanitizeActivityValue,
};
