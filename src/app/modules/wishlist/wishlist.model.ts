import { Schema, model } from 'mongoose';
import type { IWishlist } from './wishlist.interface.js';

const wishlistSchema = new Schema<IWishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

wishlistSchema.index(
  { user: 1, product: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

export const Wishlist = model<IWishlist>('Wishlist', wishlistSchema);
