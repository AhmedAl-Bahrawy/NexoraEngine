# Skill 04: Storage Operations

## Template Core Files
- `src/lib/storage/index.ts` - All storage operations

## File Upload

### uploadFile(bucket, path, file, options?)
Basic file upload to Supabase Storage.
```typescript
const result = await uploadFile('images', `users/${userId}/avatar.png`, file, {
  upsert: true,
  contentType: 'image/png',
})
// result: { path: 'users/123/avatar.png', fullPath: 'images/users/123/avatar.png' }
```

### uploadFileWithProgress(bucket, path, file, onProgress, options?)
Upload with progress tracking for UI feedback. Simulates progress updates every 100ms.
```typescript
await uploadFileWithProgress('images', path, file, (progress) => {
  setProgress({
    percentage: progress.percentage,   // 0-100
    loadedMB: progress.loadedMB,        // Uploaded MB
    remainingMB: progress.remainingMB,  // Remaining MB
  })
})
```

### uploadWithValidation(bucket, path, file, validator)
Upload with custom validation function.
```typescript
await uploadWithValidation('uploads', path, file, (file) => {
  if (file.size > 10 * 1024 * 1024) return { isValid: false, error: 'Too large' }
  return { isValid: true }
})
```

### uploadImage(bucket, path, file)
Uploads images with automatic validation (max 5MB, image mime types only).
Allowed types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml

### uploadDocument(bucket, path, file)
Uploads documents with automatic validation (max 10MB, document mime types only).
Allowed types: application/pdf, application/msword, .docx, text/plain

## File Access

### getPublicUrl(bucket, path)
Returns the permanent public URL for a file. Requires the bucket to be public.
```typescript
const url = getPublicUrl('images', 'users/123/avatar.png')
// Returns: https://project.supabase.co/storage/v1/object/public/images/users/123/avatar.png
```

### getSignedUrl(bucket, path, expiresIn?)
Returns a temporary signed URL for private files. Default expiry: 60 seconds.
```typescript
const url = await getSignedUrl('private-docs', 'contracts/agreement.pdf', 3600)
// URL valid for 1 hour
```

### downloadFile(bucket, path)
Downloads a file as a Blob for in-browser processing.
```typescript
const blob = await downloadFile('documents', 'reports/monthly.pdf')
```

## File Management

### deleteFile(bucket, path)
Deletes a single file from storage.
```typescript
await deleteFile('images', 'users/123/avatar.png')
```

### deleteFiles(bucket, paths)
Deletes multiple files in one call.
```typescript
await deleteFiles('images', ['path1.jpg', 'path2.jpg', 'path3.jpg'])
```

### listFiles(bucket, path?)
Lists files in a bucket or sub-path. Returns StorageObject[].

### moveFile(bucket, fromPath, toPath)
Moves/renames a file within the same bucket.
```typescript
await moveFile('images', 'temp/upload.jpg', 'final/upload.jpg')
```

### copyFile(bucket, fromPath, toPath)
Copies a file within the same bucket.
```typescript
const result = await copyFile('images', 'original.jpg', 'copy.jpg')
```

### getFileInfo(bucket, path)
Gets file metadata via signed URL HEAD request.
```typescript
const info = await getFileInfo('images', 'users/123/avatar.png')
// { size: 12345, lastModified: '...', contentType: 'image/png', cacheControl: '...' }
```

### createFolder(bucket, folderPath)
Creates a folder by uploading an empty `.keep` placeholder file.

### uploadFromURL(bucket, path, url)
Downloads a file from a URL and uploads it to storage.

## Storage + Database Pattern (Template Standard)
The template uses `storage_files` database table to track file metadata. This is the preferred pattern:

1. **Upload to Storage**: `uploadFile(bucket, path, file)`
2. **Create DB Record**: `insertOne('storage_files', { user_id, team_id, bucket_id, path, file_name, file_size, content_type, public_url })`
3. **List via DB**: `fetchAll('storage_files', { filter: (q) => q.eq('user_id', userId) })`
4. **Delete both**: `deleteFile(bucket, path)` + `deleteById('storage_files', fileId)`

This ensures:
- RLS filters files at the database level
- File metadata is queryable (size, type, dates)
- Realtime notifications work for file changes
- No need for `storage.list()` which bypasses RLS
