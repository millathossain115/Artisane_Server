import type { Types } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isDeleted?: boolean;
  seedSource?: {
    site: string;
    url?: string;
    capturedAt: Date;
    note?: string;
  };
}

export interface ICategoryDocument extends ICategory {
  _id: Types.ObjectId;
}
