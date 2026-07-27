import { Schema, model } from 'mongoose';
import type { IActivityChange, IActivityLog } from './activityLog.interface.js';

const activityChangeSchema = new Schema<IActivityChange>(
  {
    after: { type: Schema.Types.Mixed },
    before: { type: Schema.Types.Mixed },
    field: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const activityLogSchema = new Schema<IActivityLog>(
  {
    actorEmail: { type: String, index: true, trim: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorName: { type: String, trim: true },
    actorRole: {
      type: String,
      enum: ['admin', 'system', 'user'],
      default: 'system',
      index: true,
    },
    action: { type: String, required: true, index: true, trim: true },
    browser: { type: String, trim: true },
    changes: { type: [activityChangeSchema], default: [] },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    ipAddress: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    module: {
      type: String,
      enum: [
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
      ],
      required: true,
      index: true,
    },
    os: { type: String, trim: true },
    severity: {
      type: String,
      enum: ['high', 'low', 'medium'],
      default: 'low',
      index: true,
    },
    source: {
      type: String,
      enum: [
        'admin',
        'courier_webhook',
        'payment_gateway',
        'scheduler',
        'system',
        'user',
      ],
      default: 'system',
      index: true,
    },
    status: {
      type: String,
      enum: ['failed', 'success', 'warning'],
      default: 'success',
      index: true,
    },
    summary: { type: String, required: true, trim: true },
    targetId: { type: String, index: true, trim: true },
    targetLabel: { type: String, index: true, trim: true },
    targetType: { type: String, index: true, trim: true },
    userAgent: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ module: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ summary: 'text', targetLabel: 'text', actorEmail: 'text' });

export const ActivityLog = model<IActivityLog>(
  'ActivityLog',
  activityLogSchema,
);
