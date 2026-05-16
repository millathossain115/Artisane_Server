import type { PipelineStage } from 'mongoose';
import { Types } from 'mongoose';

export const buildProductMatchStage = (query: Record<string, unknown>) => {
  const searchTerm =
    typeof query.searchTerm === 'string' ? query.searchTerm.trim() : '';
  const category =
    typeof query.category === 'string' ? query.category.trim() : '';
  const minPrice =
    typeof query.minPrice === 'string' ? Number(query.minPrice) : undefined;
  const maxPrice =
    typeof query.maxPrice === 'string' ? Number(query.maxPrice) : undefined;

  const matchStage: Record<string, unknown> = {
    isDeleted: false,
  };

  if (searchTerm) {
    matchStage.name = {
      $regex: searchTerm,
      $options: 'i',
    };
  }

  if (category && Types.ObjectId.isValid(category)) {
    matchStage.category = new Types.ObjectId(category);
  }

  if (
    typeof minPrice === 'number' &&
    !Number.isNaN(minPrice) &&
    typeof maxPrice === 'number' &&
    !Number.isNaN(maxPrice)
  ) {
    matchStage.price = { $gte: minPrice, $lte: maxPrice };
  } else if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
    matchStage.price = { $gte: minPrice };
  } else if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
    matchStage.price = { $lte: maxPrice };
  }

  return matchStage;
};

export const buildProductSortStage = (query: Record<string, unknown>) => {
  const sortBy = typeof query.sortBy === 'string' ? query.sortBy : 'newest';
  const sortOrder =
    typeof query.sortOrder === 'string' ? query.sortOrder : 'desc';

  const sortStage: Record<string, 1 | -1> = { createdAt: -1 };

  if (sortBy === 'price') {
    sortStage.price = sortOrder === 'asc' ? 1 : -1;
    delete sortStage.createdAt;
  }

  if (sortBy === 'rating') {
    sortStage.averageRating = sortOrder === 'asc' ? 1 : -1;
    delete sortStage.createdAt;
  }

  if (sortBy === 'newest') {
    sortStage.createdAt = sortOrder === 'asc' ? 1 : -1;
  }

  return sortStage;
};

export const buildProductAggregationPipeline = (
  query: Record<string, unknown>,
  skip: number,
  limit: number,
): PipelineStage[] => {
  const matchStage = buildProductMatchStage(query);
  const sortStage = buildProductSortStage(query);

  return [
    {
      $match: matchStage,
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category',
      },
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'reviews',
        let: { productId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$product', '$$productId'] },
                  { $eq: ['$isDeleted', false] },
                ],
              },
            },
          },
        ],
        as: 'reviews',
      },
    },
    {
      $addFields: {
        averageRating: {
          $ifNull: [{ $avg: '$reviews.rating' }, 0],
        },
        reviewCount: {
          $size: '$reviews',
        },
        category: {
          _id: '$category._id',
          name: '$category.name',
          slug: '$category.slug',
        },
      },
    },
    {
      $project: {
        reviews: 0,
      },
    },
    {
      $facet: {
        meta: [{ $count: 'total' }],
        data: [{ $sort: sortStage }, { $skip: skip }, { $limit: limit }],
      },
    },
  ];
};
