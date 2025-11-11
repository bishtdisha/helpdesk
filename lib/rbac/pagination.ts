/**
 * Pagination and Filtering Utilities for RBAC Performance Optimization
 * 
 * This module provides utilities for efficient pagination and filtering
 * of large datasets in RBAC operations.
 */

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterOptions {
  search?: string;
  roleId?: string;
  teamId?: string;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  sortBy: 'createdAt',
  sortOrder: 'desc' as const,
};

/**
 * Validate and normalize pagination options
 */
export function normalizePaginationOptions(options: PaginationOptions = {}): Required<PaginationOptions> {
  const page = Math.max(1, options.page || DEFAULT_PAGINATION.page);
  const limit = Math.min(
    Math.max(1, options.limit || DEFAULT_PAGINATION.limit),
    DEFAULT_PAGINATION.maxLimit
  );
  const sortBy = options.sortBy || DEFAULT_PAGINATION.sortBy;
  const sortOrder = options.sortOrder || DEFAULT_PAGINATION.sortOrder;

  return { page, limit, sortBy, sortOrder };
}

/**
 * Calculate skip value for database queries
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginatedResult<any>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Build Prisma where clause from filter options
 */
export function buildUserFilterWhere(filters: FilterOptions) {
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.roleId) {
    where.roleId = filters.roleId;
  }

  if (filters.teamId) {
    where.teamId = filters.teamId;
  }

  if (typeof filters.isActive === 'boolean') {
    where.isActive = filters.isActive;
  }

  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = filters.createdAfter;
    }
    if (filters.createdBefore) {
      where.createdAt.lte = filters.createdBefore;
    }
  }

  return where;
}

/**
 * Build Prisma orderBy clause from sort options
 */
export function buildSortOrder(sortBy: string, sortOrder: 'asc' | 'desc') {
  // Map common sort fields to their database equivalents
  const sortFieldMap: Record<string, string> = {
    name: 'name',
    email: 'email',
    role: 'role.name',
    team: 'team.name',
    created: 'createdAt',
    updated: 'updatedAt',
    lastLogin: 'lastLoginAt',
  };

  const field = sortFieldMap[sortBy] || sortBy;
  
  // Handle nested sorting (e.g., role.name)
  if (field.includes('.')) {
    const [relation, relationField] = field.split('.');
    return { [relation]: { [relationField]: sortOrder } };
  }

  return { [field]: sortOrder };
}

/**
 * Build team filter where clause
 */
export function buildTeamFilterWhere(filters: Omit<FilterOptions, 'roleId'>) {
  const where: any = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {};
    if (filters.createdAfter) {
      where.createdAt.gte = filters.createdAfter;
    }
    if (filters.createdBefore) {
      where.createdAt.lte = filters.createdBefore;
    }
  }

  return where;
}



/**
 * Generic paginated query executor
 */
export async function executePaginatedQuery<T>(
  countQuery: () => Promise<number>,
  dataQuery: (skip: number, take: number) => Promise<T[]>,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const { page, limit } = normalizePaginationOptions(options);
  const skip = calculateSkip(page, limit);

  // Execute count and data queries in parallel for better performance
  const [total, data] = await Promise.all([
    countQuery(),
    dataQuery(skip, limit),
  ]);

  return {
    data,
    pagination: createPaginationMeta(page, limit, total),
  };
}

/**
 * Cache key generator for paginated results
 */
export function generateCacheKey(
  prefix: string,
  options: PaginationOptions,
  filters: FilterOptions = {}
): string {
  const normalized = normalizePaginationOptions(options);
  const filterKeys = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}:${value}`)
    .sort()
    .join('|');

  return `${prefix}:page:${normalized.page}:limit:${normalized.limit}:sort:${normalized.sortBy}:${normalized.sortOrder}:filters:${filterKeys}`;
}

/**
 * Validate sort field to prevent SQL injection
 */
export function validateSortField(field: string, allowedFields: string[]): boolean {
  return allowedFields.includes(field);
}

/**
 * Common allowed sort fields for different entities
 */
export const ALLOWED_SORT_FIELDS = {
  users: ['name', 'email', 'created', 'updated', 'role', 'team', 'lastLogin'] as string[],
  teams: ['name', 'created', 'updated', 'memberCount'] as string[],
  roles: ['name', 'created', 'updated', 'userCount'] as string[],

};