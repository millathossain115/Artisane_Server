import type { Types } from 'mongoose';

export interface IWishlist {
  user: Types.ObjectId;
  product: Types.ObjectId;
  isDeleted?: boolean;
}

export interface ICreateWishlistPayload {
  product: string;
}
