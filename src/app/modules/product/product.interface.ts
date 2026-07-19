import type { Types } from 'mongoose';

export interface IProduct {
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  category: Types.ObjectId;
  brand?: string;
  images?: string[];
  isDeleted?: boolean;
  seedSource?: {
    site: string;
    url?: string;
    capturedAt: Date;
    note?: string;
  };
}

export interface IProductDocument extends IProduct {
  _id: Types.ObjectId;
}
