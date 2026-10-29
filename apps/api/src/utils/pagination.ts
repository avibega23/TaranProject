export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function readPage(query: { page?: unknown; limit?: unknown }): { page: number; limit: number } {
  const pageRaw = Array.isArray(query.page) ? query.page[0] : query.page;
  const limitRaw = Array.isArray(query.limit) ? query.limit[0] : query.limit;
  const page = Math.max(1, Number(pageRaw) || 1);
  const limit = Math.min(50, Math.max(1, Number(limitRaw) || 12));
  return { page, limit };
}

export function toPagination(page: number, limit: number, total: number): Pagination {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
