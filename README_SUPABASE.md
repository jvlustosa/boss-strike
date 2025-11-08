# Supabase Setup Guide

## Database Setup

1. Create a new Supabase project at https://supabase.com

2. Go to SQL Editor in your Supabase dashboard

3. Run the SQL from `supabase/seed.sql` to create:
   - `profiles` table (extends auth.users)
   - `game_progress` table (stores user progress)
   - `game_stats` table (stores game statistics)
   - `skins` table (all available skins)
   - `user_skins` table (skins owned by users)
   - Row Level Security (RLS) policies
   - Automatic profile creation trigger
   - Automatic default skin unlock trigger
   - Initial example skins data

**Note:** The seed file is idempotent - you can run it multiple times safely. It includes all table structures, triggers, functions, and initial data.

For detailed database structure reference, see `supabase/DATABASE_STRUCTURE.md`

## Environment Variables

1. Create a `.env` file in the root directory (copy from `env.example.txt`):
   ```bash
   # Windows
   copy env.example.txt .env
   
   # Linux/Mac
   cp env.example.txt .env
   ```

2. Get your Supabase credentials:
   - Go to Project Settings → API
   - Copy the "Project URL" → `VITE_SUPABASE_URL`
   - Copy the "anon public" key → `VITE_SUPABASE_ANON_KEY`

3. Edit your `.env` file and add your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

**⚠️ SECURITY WARNING:**
- **NEVER** use `SUPABASE_SECRET_KEY` in the frontend!
- The secret key has admin privileges and bypasses Row Level Security
- If you use `VITE_` prefix, the variable will be exposed in the client bundle
- Secret key should ONLY be used in server-side code (API routes, backend services)
- For frontend, use only `VITE_SUPABASE_ANON_KEY` (anon/public key)

**Note:** Make sure `.env` is in your `.gitignore` to keep your credentials secure!

## Features

- **User Authentication**: Sign up/login modal appears when starting the first game
- **Progress Sync**: Game progress automatically syncs to Supabase when logged in
- **LocalStorage Fallback**: Works offline with localStorage, syncs when online
- **Auto Profile Creation**: Profile and progress tables created automatically on signup

## Authentication Flow

1. User clicks "JOGAR" on first game start
2. Auth modal appears if not logged in
3. User can:
   - Sign up (creates account + profile + initial progress)
   - Sign in (loads existing progress)
   - Skip (plays without saving progress)

## Database Schema

### profiles
- `id` (UUID, FK to auth.users)
- `username` (TEXT, unique)
- `email` (TEXT)
- `created_at`, `updated_at`

### game_progress
- `id` (UUID)
- `user_id` (UUID, FK to profiles)
- `level` (INTEGER, default: 1)
- `victories` (INTEGER, default: 0)
- `last_played_at` (TIMESTAMPTZ)
- `created_at`, `updated_at`

### game_stats
- `id` (UUID)
- `user_id` (UUID, FK to profiles)
- `total_games_played` (INTEGER)
- `total_bosses_defeated` (INTEGER)
- `highest_level_reached` (INTEGER)
- `total_play_time_seconds` (INTEGER)
- `created_at`, `updated_at`

### skins
- `id` (UUID)
- `name` (TEXT, unique) - identificador único da skin
- `display_name` (TEXT) - nome exibido ao usuário
- `description` (TEXT) - descrição da skin
- `rarity` (TEXT) - 'common', 'rare', 'epic', 'legendary'
- `unlock_condition` (TEXT) - descrição de como desbloquear
- `unlock_level` (INTEGER) - nível necessário para desbloquear
- `unlock_victories` (INTEGER) - vitórias necessárias para desbloquear
- `image_url` (TEXT) - URL da imagem da skin
- `sprite_data` (JSONB) - dados do sprite (cores, padrões, etc)
- `is_default` (BOOLEAN) - se é a skin padrão
- `created_at`, `updated_at`

### user_skins
- `id` (UUID)
- `user_id` (UUID, FK to profiles)
- `skin_id` (UUID, FK to skins)
- `unlocked_at` (TIMESTAMPTZ) - quando foi desbloqueada
- `is_equipped` (BOOLEAN) - se está equipada
- `created_at`
- UNIQUE(user_id, skin_id) - um usuário não pode ter a mesma skin duas vezes

