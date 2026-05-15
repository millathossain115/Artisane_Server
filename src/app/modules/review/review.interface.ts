import type { Types } from 'mongoose';

export interface IReview {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  comment?: string;
  isDeleted?: boolean;
}

export interface ICreateReviewPayload {
  product: string;
  rating: number;
  comment?: string;
}

export interface IUpdateReviewPayload {
  rating?: number;
  comment?: string;
}
