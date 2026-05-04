# Storage Guide

## Overview

The storage layer provides file upload, download, and management operations for Supabase Storage. The template uses a dual-tracking pattern: files are stored in Supabase Storage AND tracked in the `storage_files` database table for RLS-filtered queries.

## Files

| File | Purpose |
|------|---------|
| `src/lib/storage/index.ts` | All storage operations |
| `supabase/migrations/0002_storage_files.sql` | Storage files tracking table + test bucket |

## The Storage Files Pattern (Template Standard)

This template uses a database table (`storage_files`) to track file metadata. This is the **recommended pattern** because:

1. **RLS enforcement** - Database policies filter files by user/team
2. **Queryable metadata** - File size, type, dates are in the database
3. **Realtime notifications** - Changes to file records trigger realtime events
4. **No `storage.list()`** - That bypasses RLS and can't filter by team

### Workflow
```
Upload → Store in bucket → Create storage_files record → Query via database
Delete → Delete from bucket → Delete storage_files record
```

## Upload Operations

### Basic Upload
```typescript
import { uploadFile, getPublicUrl } from './lib/storage'

const result = await uploadFile('test', `users/${userId}/avatar.png`, file, {
  upsert: true,
  contentType: 'image/png',
})

// Get the public URL
const url = getPublicUrl('test', result.path)
```

### Upload with Progress
```typescript
import { uploadFileWithProgress } from './lib/storage'

await uploadFileWithProgress('test', path, file, (progress) => {
  setUploadProgress({
    percentage: progress.percentage,    // 0-100
    loadedMB: progress.loadedMB,         // Already uploaded
    remainingMB: progress.remainingMB,   // Still to upload
  })
})
```

### Upload with Validation
```typescript
import { uploadImage, uploadDocument } from './lib/storage'

// Image upload (max 5MB, image types only)
await uploadImage('images', `photos/${userId}/${Date.now()}.jpg`, file)

// Document upload (max 10MB, PDF/DOC/TXT only)
await uploadDocument('documents', `docs/${userId}/${Date.now()}.pdf`, file)
```

### Atomic Upload (Storage + Database)
```typescript
import { uploadFile, getPublicUrl } from './lib/storage'
import { insertOne } from './lib/database'

// 1. Upload to storage
const path = `${userId}/${Date.now()}_${file.name}`
await uploadFile('test', path, file)

// 2. Get URL
const url = getPublicUrl('test', path)

// 3. Create database record
await insertOne('storage_files', {
  user_id: userId,
  team_id: teamId || null,
  bucket_id: 'test',
  path,
  file_name: file.name,
  file_size: file.size,
  content_type: file.type,
  public_url: url,
})
```

## File Access

### Public URL
```typescript
const url = getPublicUrl('test', 'path/to/file.jpg')
// Returns: https://project.supabase.co/storage/v1/object/public/test/path/to/file.jpg
```

### Signed URL (Temporary Access)
```typescript
import { getSignedUrl } from './lib/storage'

const url = await getSignedUrl('private-docs', 'contracts/agreement.pdf', 3600)
// URL valid for 1 hour
```

### Download
```typescript
import { downloadFile } from './lib/storage'

const blob = await downloadFile('documents', 'reports/monthly.pdf')
// Use blob for in-browser processing
```

## File Management

### Delete
```typescript
import { deleteFile } from './lib/storage'
import { deleteById } from './lib/database'

// 1. Delete from storage
await deleteFile('test', path)

// 2. Delete database record
await deleteById('storage_files', fileId)
```

### List Files
```typescript
import { listFiles } from './lib/storage'

// From storage (bypasses RLS - not recommended)
const files = await listFiles('test', 'users/123/')
```

**Recommended:** Query via database instead:
```typescript
import { fetchAll } from './lib/database'
// or use smart query hooks
const { data: files } = usePersonalStorageFiles(userId)
```

### Move/Rename
```typescript
import { moveFile } from './lib/storage'

await moveFile('images', 'temp/upload.jpg', 'final/upload.jpg')
```

### Copy
```typescript
import { copyFile } from './lib/storage'

await copyFile('images', 'original.jpg', 'copy.jpg')
```

### Get File Info
```typescript
import { getFileInfo } from './lib/storage'

const info = await getFileInfo('images', 'users/123/avatar.png')
// { size: 12345, lastModified: '...', contentType: 'image/png', cacheControl: '...' }
```

## Smart Query Storage Hooks

### Fetch Files
```typescript
import { usePersonalStorageFiles, useTeamStorageFiles } from './lib/query'

// Personal files
const { data: personalFiles } = usePersonalStorageFiles(userId)

// Team files
const { data: teamFiles } = useTeamStorageFiles(teamId)
```

### Create File Record
```typescript
import { useCreateStorageFile } from './lib/query'

const createFile = useCreateStorageFile()
await createFile.mutateAsync({
  user_id: userId,
  team_id: teamId,
  bucket_id: 'test',
  path,
  file_name: file.name,
  file_size: file.size,
  content_type: file.type,
  public_url: url,
})
// Cache automatically updated
```

### Delete File Record
```typescript
import { useDeleteStorageFile } from './lib/query'

const deleteFile = useDeleteStorageFile()
await deleteFile.mutateAsync({ id: fileId, userId, teamId })
// Cache automatically updated
```

### Realtime
```typescript
import { useStorageFilesRealtime } from './lib/query'

useStorageFilesRealtime(userId, teamId)
// File list auto-updates when files are added/removed
```

## Storage Configuration

### Buckets
Create buckets in Supabase Dashboard → Storage, or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('test', 'Test Bucket', true);
```

### Bucket Policies
Set policies to control access:

```sql
-- Public read
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'test');

-- Authenticated upload
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Owner-only delete
CREATE POLICY "Owner Delete" ON storage.objects
  FOR DELETE USING (auth.uid() = owner);
```

## File Validation

The storage layer includes built-in validators:

| Validator | Max Size | Allowed Types |
|-----------|----------|---------------|
| `validateImage()` | 5 MB | jpeg, png, gif, webp, svg |
| `validateDocument()` | 10 MB | pdf, doc, docx, txt |
| `validateFile(options?)` | Configurable | Configurable |

Custom validation:
```typescript
import { uploadWithValidation } from './lib/storage'

await uploadWithValidation('uploads', path, file, (file) => {
  if (file.size > 100 * 1024 * 1024) return { isValid: false, error: 'Max 100MB' }
  if (!file.name.endsWith('.zip')) return { isValid: false, error: 'ZIP only' }
  return { isValid: true }
})
```
