export type Timestamp = string;
export type UUID = string;

// ============================================================================
// Database Structure Types
// Generated from Supabase schema
// ============================================================================

// ----------------------------------------------------------------------------
// auth.users table (Supabase built-in)
// ----------------------------------------------------------------------------
export interface AuthUser {
  id: UUID;
  email: string | null;
  encrypted_password: string | null;
  email_confirmed_at: Timestamp | null;
  invited_at: Timestamp | null;
  confirmation_token: string | null;
  confirmation_sent_at: Timestamp | null;
  recovery_token: string | null;
  recovery_sent_at: Timestamp | null;
  email_change_token_new: string | null;
  email_change: string | null;
  email_change_sent_at: Timestamp | null;
  last_sign_in_at: Timestamp | null;
  raw_app_meta_data: Record<string, any> | null;
  raw_user_meta_data: Record<string, any> | null;
  is_super_admin: boolean | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  phone: string | null;
  phone_confirmed_at: Timestamp | null;
  phone_change: string | null;
  phone_change_token: string | null;
  phone_change_sent_at: Timestamp | null;
  confirmed_at: Timestamp | null;
  email_change_token_current: string | null;
  email_change_confirm_status: number | null;
  banned_until: Timestamp | null;
  reauthentication_token: string | null;
  reauthentication_sent_at: Timestamp | null;
  is_sso_user: boolean;
  deleted_at: Timestamp | null;
  is_anonymous: boolean;
}

// Combined user type (auth.users + profiles)
export interface User extends AuthUser {
  profile: Profile | null;
}

// ----------------------------------------------------------------------------
// profiles table (extends auth.users)
// ----------------------------------------------------------------------------
export interface Profile {
  id: UUID;
  username: string | null;
  email: string | null;
  selected_skin: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ProfileInsert {
  id: UUID;
  username?: string | null;
  email?: string | null;
  selected_skin?: UUID | null;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface ProfileUpdate {
  username?: string | null;
  email?: string | null;
  selected_skin?: UUID | null;
  updated_at?: Timestamp;
}

// ----------------------------------------------------------------------------
// game_progress table
// ----------------------------------------------------------------------------
export interface GameProgress {
  id: UUID;
  user_id: UUID;
  level: number;
  victories: number;
  last_played_at: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface GameProgressInsert {
  id?: UUID;
  user_id: UUID;
  level?: number;
  victories?: number;
  last_played_at?: Timestamp;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface GameProgressUpdate {
  level?: number;
  victories?: number;
  last_played_at?: Timestamp;
  updated_at?: Timestamp;
}

// ----------------------------------------------------------------------------
// game_stats table
// ----------------------------------------------------------------------------
export interface GameStats {
  id: UUID;
  user_id: UUID;
  total_games_played: number;
  total_bosses_defeated: number;
  highest_level_reached: number;
  total_play_time_seconds: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface GameStatsInsert {
  id?: UUID;
  user_id: UUID;
  total_games_played?: number;
  total_bosses_defeated?: number;
  highest_level_reached?: number;
  total_play_time_seconds?: number;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface GameStatsUpdate {
  total_games_played?: number;
  total_bosses_defeated?: number;
  highest_level_reached?: number;
  total_play_time_seconds?: number;
  updated_at?: Timestamp;
}

// ----------------------------------------------------------------------------
// skins table
// ----------------------------------------------------------------------------
export type SkinRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Skin {
  id: UUID;
  name: string;
  display_name: string;
  description: string | null;
  rarity: SkinRarity;
  unlock_condition: string | null;
  unlock_level: number | null;
  unlock_victories: number | null;
  image_url: string | null;
  sprite_data: Record<string, any> | null;
  is_default: boolean;
  is_mystery: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface SkinInsert {
  id?: UUID;
  name: string;
  display_name: string;
  description?: string | null;
  rarity?: SkinRarity;
  unlock_condition?: string | null;
  unlock_level?: number | null;
  unlock_victories?: number | null;
  image_url?: string | null;
  sprite_data?: Record<string, any> | null;
  is_default?: boolean;
  is_mystery?: boolean;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface SkinUpdate {
  display_name?: string;
  description?: string | null;
  rarity?: SkinRarity;
  unlock_condition?: string | null;
  unlock_level?: number | null;
  unlock_victories?: number | null;
  image_url?: string | null;
  sprite_data?: Record<string, any> | null;
  is_default?: boolean;
  is_mystery?: boolean;
  updated_at?: Timestamp;
}

// ----------------------------------------------------------------------------
// user_skins table
// ----------------------------------------------------------------------------
export interface UserSkin {
  id: UUID;
  user_id: UUID;
  skin_id: UUID;
  unlocked_at: Timestamp;
  is_equipped: boolean;
  created_at: Timestamp;
}

export interface UserSkinInsert {
  id?: UUID;
  user_id: UUID;
  skin_id: UUID;
  unlocked_at?: Timestamp;
  is_equipped?: boolean;
  created_at?: Timestamp;
}

export interface UserSkinUpdate {
  is_equipped?: boolean;
}

// ----------------------------------------------------------------------------
// Joined/Extended Types
// ----------------------------------------------------------------------------

// UserSkin with full Skin details
export interface UserSkinWithDetails extends UserSkin {
  skin: Skin;
}

// Profile with related data
export interface ProfileWithProgress extends Profile {
  game_progress: GameProgress | null;
  game_stats: GameStats | null;
}

// Complete user data (auth + profile + progress + stats + skins)
export interface UserData {
  auth: AuthUser;
  profile: Profile;
  progress: GameProgress | null;
  stats: GameStats | null;
  skins: UserSkinWithDetails[];
  equipped_skin: UserSkinWithDetails | null;
}

// Simplified user data (most common use case)
export interface UserProfileData {
  profile: Profile;
  progress: GameProgress | null;
  stats: GameStats | null;
  skins: UserSkinWithDetails[];
  equipped_skin: UserSkinWithDetails | null;
}

// ----------------------------------------------------------------------------
// Database Views (if needed)
// ----------------------------------------------------------------------------

// Skin unlock status for a user
export interface SkinUnlockStatus {
  skin: Skin;
  is_unlocked: boolean;
  is_equipped: boolean;
  unlocked_at: Timestamp | null;
  can_unlock: boolean;
  unlock_reason: string | null;
}

// ----------------------------------------------------------------------------
// Helper Types
// ----------------------------------------------------------------------------

// Database table names
export type DatabaseTable = 
  | 'profiles'
  | 'game_progress'
  | 'game_stats'
  | 'skins'
  | 'user_skins';

// RLS policy context
export interface PolicyContext {
  user_id: UUID | null;
  is_authenticated: boolean;
}

// Query result types
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export interface QueryResults<T> {
  data: T[] | null;
  error: Error | null;
}

