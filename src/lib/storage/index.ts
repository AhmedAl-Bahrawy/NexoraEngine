/**
 * Storage Operations
 * File upload, download, and management
 */

import { supabase } from '../auth/client'
import { handleSupabaseError, StorageError } from '../utils/errors'
import { validateFile, validateImage, validateDocument } from '../utils/validators'
import { ERROR_CODES } from '../constants/supabase'

// Types
export interface UploadResult {
  path: string
  fullPath: string
}

export interface UploadOptions {
  upsert?: boolean
  contentType?: string
  cacheControl?: string
}

export interface StorageObject {
  name: string
  id: string
  updated_at: string
  created_at: string
  last_accessed_at: string
  metadata: Record<string, unknown>
  buckets: {
    id: string
    name: string
  }
}

// Upload file with progress tracking
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: UploadOptions & {
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  }
): Promise<UploadResult> {
  const totalSize = file.size
  
  // Call initial progress
  options?.onProgress?.({ loaded: 0, total: totalSize, percentage: 0 })
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? true,
      contentType: options?.contentType,
      cacheControl: options?.cacheControl,
    })

  if (error) throw handleSupabaseError(error)

  return {
    path: data.path,
    fullPath: `${bucket}/${data.path}`,
  }
}

// Upload file with progress simulation (for UI feedback)
export async function uploadFileWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress: (progress: { 
    loaded: number
    total: number
    percentage: number
    loadedMB: string
    remainingMB: string
  }) => void,
  options?: UploadOptions
): Promise<UploadResult> {
  const totalSize = file.size
  const totalMB = totalSize / (1024 * 1024)
  
  // Simulate progress updates
  const simulateProgress = () => {
    let loaded = 0
    const chunkSize = totalSize / 20 // 20 progress updates
    
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        loaded += chunkSize
        if (loaded >= totalSize) {
          loaded = totalSize
          clearInterval(interval)
          resolve()
        }
        
        const loadedMB = loaded / (1024 * 1024)
        const remainingMB = totalMB - loadedMB
        const percentage = Math.round((loaded / totalSize) * 100)
        
        onProgress({
          loaded,
          total: totalSize,
          percentage,
          loadedMB: loadedMB.toFixed(2),
          remainingMB: remainingMB.toFixed(2)
        })
      }, 100) // Update every 100ms
    })
  }

  // Start progress simulation and upload concurrently
  const progressPromise = simulateProgress()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? true,
      contentType: options?.contentType,
      cacheControl: options?.cacheControl,
    })

  await progressPromise

  if (error) throw handleSupabaseError(error)

  // Final progress update
  onProgress({
    loaded: totalSize,
    total: totalSize,
    percentage: 100,
    loadedMB: totalMB.toFixed(2),
    remainingMB: '0.00'
  })

  return {
    path: data.path,
    fullPath: `${bucket}/${data.path}`,
  }
}

// Upload with validation
export async function uploadWithValidation(
  bucket: string,
  path: string,
  file: File,
  validator: (file: File) => { isValid: boolean; error?: string }
): Promise<UploadResult> {
  const validation = validator(file)
  if (!validation.isValid) {
    throw new StorageError(
      validation.error || 'File validation failed',
      ERROR_CODES.STORAGE.INVALID_TYPE
    )
  }

  return uploadFile(bucket, path, file)
}

// Upload image with validation
export async function uploadImage(
  bucket: string,
  path: string,
  file: File
): Promise<UploadResult> {
  return uploadWithValidation(bucket, path, file, validateImage)
}

// Upload document with validation
export async function uploadDocument(
  bucket: string,
  path: string,
  file: File
): Promise<UploadResult> {
  return uploadWithValidation(bucket, path, file, validateDocument)
}

// Get public URL
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// Get signed URL (temporary access)
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 60 // seconds
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw handleSupabaseError(error)
  return data.signedUrl
}

// Download file
export async function downloadFile(
  bucket: string,
  path: string
): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)

  if (error) throw handleSupabaseError(error)
  return data
}

// Delete file
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw handleSupabaseError(error)
}

// Delete multiple files
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) throw handleSupabaseError(error)
}

// List files in bucket
export async function listFiles(
  bucket: string,
  path?: string
): Promise<StorageObject[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path || '')

  if (error) throw handleSupabaseError(error)
  return data as StorageObject[]
}

// Move file
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ message: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .move(fromPath, toPath)

  if (error) throw handleSupabaseError(error)
  return data
}

// Copy file
export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ path: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .copy(fromPath, toPath)

  if (error) throw handleSupabaseError(error)
  return data
}

// Get file info/metadata
export async function getFileInfo(
  bucket: string,
  path: string
): Promise<{
  size: number
  lastModified: string
  contentType: string
  cacheControl: string
}> {
  // Use signed URL creation to get metadata
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 1)

  if (error) throw handleSupabaseError(error)

  // Fetch headers to get metadata
  const response = await fetch(data.signedUrl, { method: 'HEAD' })
  
  return {
    size: parseInt(response.headers.get('content-length') || '0'),
    lastModified: response.headers.get('last-modified') || '',
    contentType: response.headers.get('content-type') || '',
    cacheControl: response.headers.get('cache-control') || '',
  }
}

// Create folder (upload empty placeholder)
export async function createFolder(
  bucket: string,
  folderPath: string
): Promise<void> {
  const placeholder = new File([''], '.keep', { type: 'text/plain' })
  await uploadFile(bucket, `${folderPath}/.keep`, placeholder)
}

// Upload from URL
export async function uploadFromURL(
  bucket: string,
  path: string,
  url: string
): Promise<UploadResult> {
  const response = await fetch(url)
  const blob = await response.blob()
  const file = new File([blob], path.split('/').pop() || 'file', {
    type: blob.type,
  })

  return uploadFile(bucket, path, file)
}

// Export validators for convenience
export { validateFile, validateImage, validateDocument }

// Export constants
export { ERROR_CODES as STORAGE_ERRORS }
