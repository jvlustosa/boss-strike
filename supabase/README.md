# Supabase Database Setup

## Quick Start

1. Create a Supabase project at https://supabase.com
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the entire contents of `seed.sql`
4. Run the SQL script

That's it! The script will create all tables, policies, triggers, functions, and seed initial data.

## Files

- **`seed.sql`** - Complete database setup (tables, policies, triggers, functions, initial data)
- **`DATABASE_STRUCTURE.md`** - Complete reference documentation of the database structure
- **`seed_skins.sql`** - (Deprecated) Example skins data (now included in `seed.sql`)

## What Gets Created

### Tables
- `profiles` - User profiles
- `game_progress` - User game progress
- `game_stats` - Game statistics
- `skins` - Available game skins
- `user_skins` - User-owned skins

### Security
- Row Level Security (RLS) enabled on all tables
- Policies ensuring users can only access their own data
- Public read access for skins table

### Automation
- Auto-creates profile on user signup
- Auto-initializes game progress and stats
- Auto-unlocks default skin for new users
- Auto-updates `updated_at` timestamps

### Initial Data
- Default skin
- 2 level-based unlock skins (level 5, level 10)
- 3 victory-based unlock skins (1, 5, 10 victories)

## Re-running the Seed

The seed script is **idempotent** - you can run it multiple times safely:
- Uses `IF NOT EXISTS` for tables
- Uses `DROP TRIGGER IF EXISTS` for triggers
- Uses `CREATE OR REPLACE` for functions
- Uses `ON CONFLICT DO NOTHING` for inserts

## Documentation

For complete database structure reference, see `DATABASE_STRUCTURE.md`.

