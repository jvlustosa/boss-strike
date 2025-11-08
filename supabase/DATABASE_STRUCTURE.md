# Database Structure Reference

This document provides a complete reference of the Boss Attack game database structure.

## Overview

The database uses Supabase's built-in authentication system and consists of:

### Authentication (Supabase Managed)
- `auth.users` - User authentication data (managed by Supabase)

### Application Tables
1. `profiles` - User profiles extending Supabase auth
2. `game_progress` - User game progress (level, victories)
3. `game_stats` - Detailed game statistics
4. `skins` - Available game skins
5. `user_skins` - User-owned skins

## Authentication

### auth.users (Supabase Built-in)

This table is automatically managed by Supabase and handles:
- User authentication (email/password, OAuth, etc.)
- Session management
- Email confirmation
- Password recovery
- User metadata

**Key Fields:**
- `id` (UUID) - Primary key, used as foreign key in profiles
- `email` - User email address
- `raw_user_meta_data` - Custom metadata (JSONB)
- `created_at`, `updated_at` - Timestamps

**Note:** You cannot directly modify `auth.users` via SQL. Use Supabase Auth API or Admin API.

**Relationship:**
- One-to-one with `profiles` (profiles.id → auth.users.id)

## Tables

### 1. profiles

Extends Supabase `auth.users` with additional game-specific user information.

**Relationship with auth.users:**
- `profiles.id` is a foreign key to `auth.users.id`
- One profile per auth user (1:1 relationship)
- Profile is automatically created when user signs up via trigger

**Username Validation:**
- **Length**: 3-30 characters (enforced by CHECK constraint `username_length`)
- **Format**: Only alphanumeric characters and underscore (`^[a-zA-Z0-9_]+$`) - enforced by CHECK constraint `username_format`
- **Unique**: Must be unique across all users
- **Auto-generated**: If not provided or invalid, automatically generated from email or user ID

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FK → auth.users(id) | User ID (matches auth.users) |
| `username` | TEXT | UNIQUE, CHECK constraints | Username (3-30 chars, alphanumeric + underscore) |
| `email` | TEXT | | User email |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- One-to-one with `auth.users`
- One-to-one with `game_progress`
- One-to-one with `game_stats`
- One-to-many with `user_skins`

**RLS Policies:**
- Users can SELECT, UPDATE, INSERT their own profile only

**Triggers:**
- `update_profiles_updated_at` - Auto-updates `updated_at` on UPDATE
- `on_profile_created_unlock_skin` - Unlocks default skin on profile creation

---

### 2. game_progress

Stores user's current game progress.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Progress record ID |
| `user_id` | UUID | NOT NULL, FK → profiles(id), UNIQUE | User ID (one progress per user) |
| `level` | INTEGER | NOT NULL, DEFAULT 1 | Current level reached |
| `victories` | INTEGER | NOT NULL, DEFAULT 0 | Total victories (every 5 levels) |
| `last_played_at` | TIMESTAMPTZ | DEFAULT NOW() | Last game session timestamp |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many-to-one with `profiles` (one progress per user)

**RLS Policies:**
- Users can SELECT, UPDATE, INSERT their own progress only

**Triggers:**
- `update_game_progress_updated_at` - Auto-updates `updated_at` on UPDATE

**Auto-creation:**
- Created automatically when user signs up via `handle_new_user()` trigger

---

### 3. game_stats

Stores detailed game statistics for achievements and analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Stats record ID |
| `user_id` | UUID | NOT NULL, FK → profiles(id), UNIQUE | User ID (one stats per user) |
| `total_games_played` | INTEGER | DEFAULT 0 | Total games played |
| `total_bosses_defeated` | INTEGER | DEFAULT 0 | Total bosses defeated |
| `highest_level_reached` | INTEGER | DEFAULT 1 | Highest level reached |
| `total_play_time_seconds` | INTEGER | DEFAULT 0 | Total play time in seconds |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- Many-to-one with `profiles` (one stats per user)

**RLS Policies:**
- Users can SELECT, UPDATE, INSERT their own stats only

**Triggers:**
- `update_game_stats_updated_at` - Auto-updates `updated_at` on UPDATE

**Auto-creation:**
- Created automatically when user signs up via `handle_new_user()` trigger

---

### 4. skins

All available skins in the game.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Skin ID |
| `name` | TEXT | NOT NULL, UNIQUE | Unique skin identifier |
| `display_name` | TEXT | NOT NULL | Display name for users |
| `description` | TEXT | | Skin description |
| `rarity` | TEXT | NOT NULL, DEFAULT 'common', CHECK | Rarity: 'common', 'rare', 'epic', 'legendary' |
| `unlock_condition` | TEXT | | Human-readable unlock condition |
| `unlock_level` | INTEGER | | Required level to unlock (NULL if not level-based) |
| `unlock_victories` | INTEGER | | Required victories to unlock (NULL if not victory-based) |
| `image_url` | TEXT | | URL to skin image |
| `sprite_data` | JSONB | | Sprite configuration data (colors, patterns, etc.) |
| `is_default` | BOOLEAN | DEFAULT false | Whether this is the default skin |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Relationships:**
- One-to-many with `user_skins`

**RLS Policies:**
- Anyone can SELECT (public read)
- Admin write (no policy defined, requires service role)

**Triggers:**
- `update_skins_updated_at` - Auto-updates `updated_at` on UPDATE

**Unlock Logic:**
- Skins can be unlocked by:
  - Level requirement (`unlock_level`)
  - Victory requirement (`unlock_victories`)
  - Default skin (`is_default = true`) - unlocked automatically on signup

---

### 5. user_skins

Junction table for user-owned skins.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Record ID |
| `user_id` | UUID | NOT NULL, FK → profiles(id) | User ID |
| `skin_id` | UUID | NOT NULL, FK → skins(id) | Skin ID |
| `unlocked_at` | TIMESTAMPTZ | DEFAULT NOW() | When the skin was unlocked |
| `is_equipped` | BOOLEAN | DEFAULT false | Whether the skin is currently equipped |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| UNIQUE(`user_id`, `skin_id`) | | | Prevents duplicate skin ownership |

**Relationships:**
- Many-to-one with `profiles`
- Many-to-one with `skins`

**RLS Policies:**
- Users can SELECT, UPDATE, INSERT their own skins only

**Auto-creation:**
- Default skin is automatically unlocked when profile is created via `unlock_default_skin()` trigger

---

## Functions

### 1. handle_new_user()

**Purpose:** Automatically creates user profile and initializes game data on signup.

**Trigger:** `on_auth_user_created` on `auth.users` AFTER INSERT

**Actions:**
1. Creates profile in `profiles` table
2. Initializes `game_progress` (level 1, 0 victories)
3. Initializes `game_stats` (all zeros)
4. Default skin unlock is handled by separate trigger

**Security:** `SECURITY DEFINER` - Runs with function creator's privileges

---

### 2. unlock_default_skin()

**Purpose:** Unlocks the default skin for new users.

**Trigger:** `on_profile_created_unlock_skin` on `profiles` AFTER INSERT

**Actions:**
1. Finds skin where `is_default = true`
2. Inserts into `user_skins` with `is_equipped = true`
3. Uses `ON CONFLICT DO NOTHING` to prevent errors

**Security:** `SECURITY DEFINER` - Runs with function creator's privileges

---

### 3. handle_updated_at()

**Purpose:** Auto-updates `updated_at` timestamp on table updates.

**Triggers:**
- `update_profiles_updated_at` on `profiles`
- `update_game_progress_updated_at` on `game_progress`
- `update_game_stats_updated_at` on `game_stats`
- `update_skins_updated_at` on `skins`

**Actions:**
- Sets `NEW.updated_at = NOW()` before UPDATE

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:

- **profiles**: Users can only access their own profile
- **game_progress**: Users can only access their own progress
- **game_stats**: Users can only access their own stats
- **skins**: Public read access (anyone can view available skins)
- **user_skins**: Users can only access their own skin collection

---

## Initial Data

The seed script includes example skins:

1. **default** - Default skin (common, unlocked on signup)
2. **level_5** - Veteran skin (rare, unlock at level 5)
3. **level_10** - Master skin (epic, unlock at level 10)
4. **victory_1** - First Title (common, unlock at 1 victory)
5. **victory_5** - Champion (rare, unlock at 5 victories)
6. **victory_10** - Legendary (legendary, unlock at 10 victories)

---

## Usage Examples

### Get user progress
```sql
SELECT * FROM game_progress WHERE user_id = 'user-uuid';
```

### Get user's unlocked skins
```sql
SELECT s.*, us.is_equipped, us.unlocked_at
FROM user_skins us
JOIN skins s ON us.skin_id = s.id
WHERE us.user_id = 'user-uuid';
```

### Get equipped skin
```sql
SELECT s.*
FROM user_skins us
JOIN skins s ON us.skin_id = s.id
WHERE us.user_id = 'user-uuid' AND us.is_equipped = true;
```

### Check unlockable skins
```sql
SELECT * FROM skins
WHERE (unlock_level <= 5 OR unlock_victories <= 3)
AND id NOT IN (
  SELECT skin_id FROM user_skins WHERE user_id = 'user-uuid'
);
```

---

## Migration Notes

- All tables use `IF NOT EXISTS` for idempotent creation
- Triggers use `DROP TRIGGER IF EXISTS` before creation
- Functions use `CREATE OR REPLACE` for updates
- Inserts use `ON CONFLICT DO NOTHING` to prevent errors on re-runs

---

## Version History

- **v1.0** - Initial structure with profiles, progress, stats, skins, and user_skins
- All tables include RLS policies
- Automatic profile creation on signup
- Automatic default skin unlock

