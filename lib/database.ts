// Database connection and query utilities - Server-side only
import { neon } from "@neondatabase/serverless"

let sqlInstance: ReturnType<typeof neon> | null = null

const getDatabaseUrl = () => {
  // Check if we're on the server side
  if (typeof window !== "undefined") {
    throw new Error("Database connections can only be made on the server side")
  }

  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!url) {
    console.error(
      "Available environment variables:",
      Object.keys(process.env).filter((key) => key.includes("DATABASE") || key.includes("POSTGRES")),
    )
    throw new Error("No database connection string found. Please check your environment variables in Project Settings.")
  }

  return url
}

const getSql = () => {
  if (!sqlInstance) {
    sqlInstance = neon(getDatabaseUrl())
  }
  return sqlInstance
}

export const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(target, prop) {
    const sqlInstance = getSql()
    return sqlInstance[prop as keyof typeof sqlInstance]
  },
})

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: "ASC" | "DESC"
}

export interface PaginationResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  try {
    const sqlInstance = getSql()
    const result = await sqlInstance.unsafe(query, params)
    return result as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error("Database query failed")
  }
}

export async function executePaginatedQuery<T = any>(
  baseQuery: string,
  countQuery: string,
  options: QueryOptions = {},
): Promise<PaginationResult<T>> {
  const { limit = 20, offset = 0, orderBy, orderDirection = "DESC" } = options

  let query = baseQuery
  if (orderBy) {
    query += ` ORDER BY ${orderBy} ${orderDirection}`
  }
  query += ` LIMIT ${limit} OFFSET ${offset}`

  const [data, countResult] = await Promise.all([executeQuery<T>(query), executeQuery<{ count: number }>(countQuery)])

  const total = Number.parseInt(countResult[0]?.count?.toString() || "0")
  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  }
}
