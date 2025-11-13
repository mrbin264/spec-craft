/**
 * Pagination utilities for efficient data fetching
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    limit: number;
    hasNext: boolean;
    nextCursor?: string;
  };
}

/**
 * Default pagination limits
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Validate and normalize pagination parameters
 */
export function normalizePaginationParams(params: PaginationParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(PAGINATION_DEFAULTS.MIN_LIMIT, params.limit || PAGINATION_DEFAULTS.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create paginated result from data and total count
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Encode cursor for cursor-based pagination
 * Cursor contains the ID and timestamp of the last item
 */
export function encodeCursor(id: string, timestamp?: Date | string): string {
  const data = {
    id,
    ts: timestamp ? new Date(timestamp).getTime() : Date.now(),
  };
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

/**
 * Decode cursor for cursor-based pagination
 */
export function decodeCursor(cursor: string): { id: string; ts: number } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Create cursor-paginated result
 */
export function createCursorPaginatedResult<T extends { _id: string; createdAt?: Date }>(
  data: T[],
  limit: number
): CursorPaginatedResult<T> {
  const hasNext = data.length > limit;
  const items = hasNext ? data.slice(0, limit) : data;
  
  let nextCursor: string | undefined;
  if (hasNext && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(lastItem._id, lastItem.createdAt);
  }

  return {
    data: items,
    pagination: {
      limit,
      hasNext,
      nextCursor,
    },
  };
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationFromSearchParams(
  searchParams: URLSearchParams
): PaginationParams {
  return {
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    cursor: searchParams.get('cursor') || undefined,
  };
}
