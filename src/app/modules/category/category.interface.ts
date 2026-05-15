import type { Types } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isDeleted?: boolean;
}

export interface ICategoryDocument extends ICategory {
  _id: Types.ObjectId;
}
