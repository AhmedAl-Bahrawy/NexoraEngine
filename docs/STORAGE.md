# Storage Feature

The storage module provides a robust interface for managing files in Supabase Storage buckets.

## Features

- **File Uploads**: Simple and progress-tracked uploads.
- **File Management**: List, move, copy, and delete files.
- **Public & Signed URLs**: Generate URLs for public or temporary private access.
- **Validation**: Built-in validators for images and documents.
- **Folder Support**: Create and manage virtual folders.

## Usage

### Uploading a File

```typescript
import { uploadFile } from '@/lib/storage';

const result = await uploadFile('avatars', 'user-1/profile.png', file);
```

### Uploading with Progress

```typescript
import { uploadFileWithProgress } from '@/lib/storage';

await uploadFileWithProgress('uploads', 'large-file.zip', file, (progress) => {
  console.log(`Upload progress: ${progress.percentage}%`);
});
```

### Getting a Public URL

```typescript
import { getPublicUrl } from '@/lib/storage';

const url = getPublicUrl('avatars', 'user-1/profile.png');
```

## Configuration

1. Create your buckets in the Supabase Dashboard under **Storage**.
2. Set up **RLS Policies** for your buckets to control who can upload, view, or delete files.
3. Ensure the bucket is marked as "Public" if you want to use `getPublicUrl` without signed tokens.
