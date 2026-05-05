import { getClient } from '../core/client'
import { StorageError } from '../errors/nexora-error'
import { executeRequest } from '../core/pipeline'
import { validateFile, validateImage, validateDocument } from '../utils/validators'
import { STORAGE } from '../constants/supabase'

export interface UploadResult {
  path: string
  fullPath: string
}

export interface UploadOptions {
  upsert?: boolean
  contentType?: string
  cacheControl?: string
  timeout?: number
  retries?: number
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

export interface FileMetadata {
  size: number
  lastModified: string
  contentType: string
  cacheControl: string
}

async function withStorageRetry<T>(fn: () => Promise<{ data: T | null; error: unknown }>): Promise<T> {
  return executeRequest(
    async () => {
      const result = await fn()
      if (result.error) throw StorageError.from(result.error)
      if (!result.data) throw new StorageError('No data returned')
      return result.data
    },
    { retries: 2, retryDelay: 1000 }
  )
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options?: UploadOptions & {
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  }
): Promise<UploadResult> {
  const supabase = getClient()
  const totalSize = file.size

  options?.onProgress?.({ loaded: 0, total: totalSize, percentage: 0 })

  const data = await withStorageRetry<{ path: string }>(
    () => supabase.storage.from(bucket).upload(path, file, {
      upsert: options?.upsert ?? true,
      contentType: options?.contentType,
      cacheControl: options?.cacheControl,
    })
  )

  options?.onProgress?.({ loaded: totalSize, total: totalSize, percentage: 100 })

  return {
    path: data.path,
    fullPath: `${bucket}/${data.path}`,
  }
}

export async function uploadWithValidation(
  bucket: string,
  path: string,
  file: File,
  validator: (file: File) => { isValid: boolean; error?: string },
  options?: UploadOptions
): Promise<UploadResult> {
  const validation = validator(file)
  if (!validation.isValid) {
    throw new StorageError(validation.error ?? 'File validation failed')
  }

  return uploadFile(bucket, path, file, options)
}

export async function uploadImage(
  bucket: string,
  path: string,
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  return uploadWithValidation(bucket, path, file, validateImage, options)
}

export async function uploadDocument(
  bucket: string,
  path: string,
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  return uploadWithValidation(bucket, path, file, validateDocument, options)
}

export function getPublicUrl(bucket: string, path: string): string {
  const supabase = getClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 60
): Promise<string> {
  const supabase = getClient()
  const data = await withStorageRetry<{ signedUrl: string }>(
    () => supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  )
  return data.signedUrl
}

export async function downloadFile(
  bucket: string,
  path: string
): Promise<Blob> {
  const supabase = getClient()
  const data = await withStorageRetry<Blob>(
    () => supabase.storage.from(bucket).download(path)
  )
  return data
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw StorageError.from(error)
}

export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  const supabase = getClient()
  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) throw StorageError.from(error)
}

export async function listFiles(
  bucket: string,
  path?: string
): Promise<StorageObject[]> {
  const supabase = getClient()
  const { data, error } = await supabase.storage.from(bucket).list(path ?? '')
  if (error) throw StorageError.from(error)
  return (data ?? []) as unknown as StorageObject[]
}

export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ message: string }> {
  const supabase = getClient()
  const data = await withStorageRetry<{ message: string }>(
    () => supabase.storage.from(bucket).move(fromPath, toPath)
  )
  return data
}

export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ path: string }> {
  const supabase = getClient()
  const data = await withStorageRetry<{ path: string }>(
    () => supabase.storage.from(bucket).copy(fromPath, toPath)
  )
  return data
}

export async function getFileInfo(
  bucket: string,
  path: string
): Promise<FileMetadata> {
  const supabase = getClient()
  const data = await withStorageRetry<{ signedUrl: string }>(
    () => supabase.storage.from(bucket).createSignedUrl(path, 1)
  )

  const response = await fetch(data.signedUrl, { method: 'HEAD' })

  return {
    size: parseInt(response.headers.get('content-length') ?? '0'),
    lastModified: response.headers.get('last-modified') ?? '',
    contentType: response.headers.get('content-type') ?? '',
    cacheControl: response.headers.get('cache-control') ?? '',
  }
}

export async function createFolder(
  bucket: string,
  folderPath: string
): Promise<void> {
  const placeholder = new File([''], '.keep', { type: 'text/plain' })
  await uploadFile(bucket, `${folderPath}/.keep`, placeholder)
}

export async function uploadFromURL(
  bucket: string,
  path: string,
  url: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const response = await fetch(url)
  const blob = await response.blob()
  const file = new File([blob], path.split('/').pop() ?? 'file', {
    type: blob.type,
  })

  return uploadFile(bucket, path, file, options)
}

export { validateFile, validateImage, validateDocument }
export { STORAGE as STORAGE_ERRORS }
