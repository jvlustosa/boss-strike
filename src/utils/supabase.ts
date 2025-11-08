import { createClient } from '@supabase/supabase-js';
import type {
  Profile,
  GameProgress,
  GameStats,
  Skin,
  UserSkin,
  ProfileInsert,
  GameProgressInsert,
  GameStatsInsert,
  SkinInsert,
  UserSkinInsert,
} from '../../supabase/supabase-structure';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
  },
});

// Re-export types for convenience
export type {
  Profile,
  GameProgress,
  GameStats,
  Skin,
  UserSkin,
  ProfileInsert,
  GameProgressInsert,
  GameStatsInsert,
  SkinInsert,
  UserSkinInsert,
};

