# Security Guidelines

## Supabase Keys

### ✅ Safe for Frontend (VITE_ prefix)
- `VITE_SUPABASE_URL` - Project URL (public)
- `VITE_SUPABASE_ANON_KEY` - Anon/Public key (safe to expose)

### ❌ NEVER in Frontend
- `SUPABASE_SECRET_KEY` - Service role key (admin privileges)
- Any key with `SECRET` or `SERVICE_ROLE` in the name

## Why?

### Anon Key (Safe)
- Respects Row Level Security (RLS) policies
- Limited permissions based on user authentication
- Safe to expose in client-side code
- Can be bundled with your frontend

### Secret Key (Dangerous)
- **Bypasses all RLS policies**
- Has full admin access to your database
- Can read/write/delete any data
- **MUST NEVER be exposed in frontend code**
- Only use in server-side environments (Node.js, API routes, etc.)

## Current Setup

This project uses:
- ✅ `VITE_SUPABASE_ANON_KEY` in frontend (correct)
- ❌ No secret key in frontend (correct)

## If You Need Secret Key

Only use it in:
- Server-side API routes
- Backend services
- Admin scripts
- Database migrations (if needed)

**Example (Server-side only):**
```typescript
// ✅ OK - Server-side code
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,  // No VITE_ prefix
  process.env.SUPABASE_SECRET_KEY  // No VITE_ prefix
);

// ❌ NEVER - Client-side code
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SECRET_KEY  // ⚠️ EXPOSED IN BUNDLE!
);
```

## Checklist

- [ ] Only `VITE_SUPABASE_ANON_KEY` in frontend
- [ ] No `VITE_SUPABASE_SECRET_KEY` in frontend
- [ ] `.env` file in `.gitignore`
- [ ] No keys committed to git
- [ ] RLS policies enabled on all tables

