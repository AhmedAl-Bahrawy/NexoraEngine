// Database schema types - update this based on your actual Supabase schema
// You can generate these using: supabase gen types typescript --project-id your-project-ref

// Generic database row type for legacy compatibility
export interface DbRow<T = Record<string, unknown>> {
  id: string
  created_at?: string
  updated_at?: string
  [key: string]: T[keyof T] | string | undefined
}

export interface Database {
  public: {
    Tables: {
      // Example table - replace with your actual tables
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          title: string
          content: string | null
          user_id: string
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          user_id: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          user_id?: string
          published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for commonly used patterns
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Specific table types
export type User = Tables<'users'>
export type UserInsert = InsertTables<'users'>
export type UserUpdate = UpdateTables<'users'>

export type Post = Tables<'posts'>
export type PostInsert = InsertTables<'posts'>
export type PostUpdate = UpdateTables<'posts'>

// JSON types for metadata fields
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Common status types
export type Status = 'active' | 'inactive' | 'pending' | 'archived'

// Pagination types
export interface PaginationParams {
  page?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Realtime change types
export interface RealtimeInsertPayload<T> {
  eventType: 'INSERT'
  new: T
  old: null
}

export interface RealtimeUpdatePayload<T> {
  eventType: 'UPDATE'
  new: T
  old: T
}

export interface RealtimeDeletePayload<T> {
  eventType: 'DELETE'
  new: null
  old: T
}

export type RealtimePayload<T> = 
  | RealtimeInsertPayload<T> 
  | RealtimeUpdatePayload<T> 
  | RealtimeDeletePayload<T>

// Query filter types
export interface FilterCondition {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in'
  value: unknown
}

export interface QueryOptions<T = unknown> {
  columns?: string
  filters?: FilterCondition[]
  order?: {
    column: keyof T
    ascending?: boolean
  }
  limit?: number
  offset?: number
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  count: number | null
}

// Auth-related types
export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  metadata?: Record<string, unknown>
}

// Storage types
export interface StorageUploadOptions {
  cacheControl?: string
  contentType?: string
  upsert?: boolean
}

export interface StorageObject {
  id: string
  name: string
  bucket_id: string
  owner: string | null
  created_at: string | null
  updated_at: string | null
  last_accessed_at: string | null
  metadata: Record<string, unknown>
  path_tokens: string[] | null
  version: string | null
}

// RPC function parameter/return types
export interface RpcParams {
  [key: string]: unknown
}

// Error types
export interface SupabaseError {
  message: string
  details: string
  hint: string
  code: string
}
