export interface IPaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export const calculatePagination = (
  query: Record<string, unknown>,
): IPaginationOptions => {
  const rawPage =
    typeof query.page === 'string' ? Number(query.page) : DEFAULT_PAGE;
  const rawLimit =
    typeof query.limit === 'string' ? Number(query.limit) : DEFAULT_LIMIT;

  const page =
    Number.isFinite(rawPage) && rawPage > 0
      ? Math.floor(rawPage)
      : DEFAULT_PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): IPaginationMeta => {
  return {
    page,
    limit,
    total,
    totalPage: Math.ceil(total / limit),
  };
};
