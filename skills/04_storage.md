# 04 — Storage (File Upload / Download)

**Source files:**
- `src/lib/storage/index.ts` — all storage helpers

---

## 📁 Pattern: Upload a File

```ts
import { uploadFile } from '@/lib/storage';

async function handleUpload(file: File, userId: string) {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { path: savedPath, error } = await uploadFile('avatars', path, file);

  if (error) console.error('Upload failed:', error.message);
  return savedPath;
}
```

---

## 📁 Pattern: Get a Public URL

```ts
import { getPublicUrl } from '@/lib/storage';

const url = getPublicUrl('avatars', savedPath);
// Use `url` as <img src={url} />
```

---

## 📁 Pattern: Download a File (private bucket)

```ts
import { supabase } from '@/lib/database/client';

const { data, error } = await supabase.storage
  .from('private-files')
  .download('path/to/file.pdf');

if (data) {
  const url = URL.createObjectURL(data);
  window.open(url);
}
```

---

## 📁 Pattern: Delete a File

```ts
const { error } = await supabase.storage
  .from('avatars')
  .remove(['path/to/old-avatar.png']);
```

---

## 📁 Pattern: List Files in a Folder

```ts
const { data: files } = await supabase.storage
  .from('uploads')
  .list('my-folder/', { limit: 100 });
```

---

## 📁 Pattern: Create a Signed URL (time-limited access)

```ts
const { data } = await supabase.storage
  .from('private-files')
  .createSignedUrl('document.pdf', 60); // 60 seconds

window.open(data?.signedUrl);
```

---

## ⚙️ Bucket Setup Checklist

When creating a new bucket in Supabase Dashboard → Storage:
- [ ] Set **Public** if files should be accessible without auth (e.g. avatars).
- [ ] Set **Private** if files need signed URLs or RLS (e.g. user documents).
- [ ] Add a Storage policy: `INSERT` for authenticated users, `SELECT` for public/owner.

---

## ⚠️ Gotchas

- Public bucket URLs look like: `https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>`.
- File **MIME type** must match the bucket's allowed MIME types (set in bucket settings).
- Upsert (overwrite) requires passing `{ upsert: true }` as the upload option.
- Max file size is **50 MB** by default — configurable in Supabase Dashboard.
