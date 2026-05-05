# Storage System Reference

## Upload Operations

### `uploadFile(bucket: string, path: string, file: File | Blob, options?): Promise<UploadResult>`
Uploads file with optional progress callback.

### `uploadWithValidation(bucket, path, file, validator, options?): Promise<UploadResult>`
Uploads with custom validation.

### `uploadImage(bucket, path, file, options?): Promise<UploadResult>`
Uploads image with type validation.

### `uploadDocument(bucket, path, file, options?): Promise<UploadResult>`
Uploads document with type validation.

### `uploadFromURL(bucket, path, url, options?): Promise<UploadResult>`
Downloads from URL then uploads.

## URL Operations

### `getPublicUrl(bucket: string, path: string): string`
Gets permanent public URL.

### `getSignedUrl(bucket, path, expiresIn?: number): Promise<string>`
Gets temporary signed URL (default: 60s).

## File Operations

### `downloadFile(bucket: string, path: string): Promise<Blob>`
Downloads file as blob.

### `deleteFile(bucket: string, path: string): Promise<void>`
Deletes single file.

### `deleteFiles(bucket: string, paths: string[]): Promise<void>`
Deletes multiple files.

### `listFiles(bucket: string, path?: string): Promise<StorageObject[]>`
Lists files in path.

### `moveFile(bucket, fromPath, toPath): Promise<{ message: string }>`
Moves file.

### `copyFile(bucket, fromPath, toPath): Promise<{ path: string }>`
Copies file.

### `getFileInfo(bucket, path): Promise<FileMetadata>`
Gets file metadata.

### `createFolder(bucket, folderPath): Promise<void>`
Creates folder placeholder.

## UploadOptions

```typescript
interface UploadOptions {
  upsert?: boolean
  contentType?: string
  cacheControl?: string
  timeout?: number
  retries?: number
}
```

## Validation

### `validateFile(file: File, options?): { isValid: boolean; error?: string }`
Validates file size and type.

### `validateImage(file: File)`
Validates image (jpeg, png, gif, max 5MB).

### `validateDocument(file: File)`
Validates document (pdf, doc, docx, max 10MB).
