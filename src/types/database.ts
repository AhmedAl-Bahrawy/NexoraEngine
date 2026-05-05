export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GenericRow<T = Record<string, unknown>> = {
  id: string
  created_at?: string
  updated_at?: string
} & T

export interface PaginationParams {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

export interface ApiListResponse<T> {
  data: T[]
  count: number | null
  error: Error | null
}

export interface StorageUploadOptions {
  cacheControl?: string
  contentType?: string
  upsert?: boolean
}

export interface StorageObject {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, unknown>
}
