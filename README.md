# Supabase Full-Stack Template

A comprehensive, general-purpose template for building modern web applications with **React**, **TypeScript**, **Tailwind CSS v4**, and **Supabase**.

This project is designed to be a "Swiss Army Knife" for Supabase development, providing pre-configured modules for authentication, database operations, real-time updates, and storage.

## 🚀 Quick Start

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables**: Create a `.env` file with:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run development server**: `npm run dev`

## 🛠 Features

This template includes dedicated modules and documentation for every major Supabase feature:

| Feature | Description | Documentation |
|---------|-------------|---------------|
| **Authentication** | Email/Password, Magic Links, OAuth, and MFA. | [Read More](./docs/AUTHENTICATION.md) |
| **Database** | Type-safe CRUD, advanced queries, and pagination. | [Read More](./docs/DATABASE.md) |
| **Real-time** | Instant updates via Postgres changes, Presence, and Broadcast. | [Read More](./docs/REALTIME.md) |
| **Storage** | Robust file management with progress tracking and validation. | [Read More](./docs/STORAGE.md) |

## 📂 Project Structure

```text
src/
├── hooks/          # Custom React hooks (useAuth, useSupabase, etc.)
├── lib/            # Modular Supabase utility layers
│   ├── auth/       # Auth operations and client
│   ├── database/   # CRUD, queries, and realtime
│   ├── storage/    # File management
│   └── utils/      # Shared helpers and error handling
├── providers/      # React Context providers
├── types/          # TypeScript definitions
└── App.tsx         # Main application entry and demo UI
```

## 📖 How to Use This Template

For a detailed guide on how to adapt this template for your own projects, check out the [Supabase Template Skill Guide](./SUPABASE_SKILL.md). It covers:

- Project initialization
- Common data fetching patterns
- Real-time implementation
- Storage best practices

## 🎨 UI & UX

The project uses **Tailwind CSS v4** for a modern, responsive, and highly customizable UI. The `src/App.tsx` file provides a general-purpose dashboard layout that can be easily adapted for any application.

## 📄 License

MIT
