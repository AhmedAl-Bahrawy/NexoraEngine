# 📚 SupabaseFullLearn — Skills Folder

This folder is your **personal knowledge base** for this project.
Every time you learn something new, implement a pattern, or discover a gotcha — write it here.

## 📁 Folder Structure

```
skills/
├── README.md                  ← You are here (master index)
├── 01_authentication.md       ← Sign in, sign up, OAuth, MFA, session
├── 02_database.md             ← CRUD, filters, joins, pagination
├── 03_realtime.md             ← Subscriptions, live queries, channels
├── 04_storage.md              ← File upload, download, public URLs, buckets
├── 05_rls_policies.md         ← Row Level Security patterns & common fixes
├── 06_edge_functions.md       ← Writing & calling Supabase Edge Functions
├── 07_hooks_patterns.md       ← React hooks built on top of Supabase
├── 08_migrations.md           ← Writing & applying DB migrations
└── 09_debugging_gotchas.md    ← Known bugs, error codes, and fixes
```

## ✅ How to Use This Folder

### When you **start working** tomorrow:
1. Open the relevant skill file for what you'll build (e.g. `02_database.md` for a new table).
2. Read the "Pattern" section to copy the correct code shape.
3. Check `09_debugging_gotchas.md` if you hit an error.

### When you **finish a feature**:
1. Add what you learned to the relevant skill file.
2. If you fixed a bug, add it to `09_debugging_gotchas.md`.
3. Keep each entry short: **what it is**, **the code**, **why it works**.

### When you **start a new feature**:
Ask yourself:
- Do I need auth? → `01_authentication.md`
- Do I need to read/write data? → `02_database.md`
- Do I need live updates? → `03_realtime.md`
- Do I need file uploads? → `04_storage.md`
- Am I getting 403 errors? → `05_rls_policies.md`

---

> **Rule:** If you had to think about it for more than 10 minutes, write it here so tomorrow-you doesn't have to.
