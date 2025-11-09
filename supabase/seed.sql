-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- NOTES ON AUTHENTICATION
-- ============================================================================
-- This database uses Supabase's built-in auth.users table for authentication.
-- The auth.users table is managed by Supabase and includes:
--   - User authentication (email/password, OAuth, etc.)
--   - Session management
--   - Email confirmation
--   - Password recovery
--
-- The profiles table extends auth.users with additional game-specific data.
-- When a user signs up, a trigger automatically creates their profile.
-- ============================================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$')
);

-- Add comment explaining username validation
COMMENT ON COLUMN public.profiles.username IS 'Username must be 3-30 characters, alphanumeric and underscores only';

-- Game progress table
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  victories INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Game stats table (for tracking achievements and detailed stats)
CREATE TABLE IF NOT EXISTS public.game_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_games_played INTEGER DEFAULT 0,
  total_bosses_defeated INTEGER DEFAULT 0,
  highest_level_reached INTEGER DEFAULT 1,
  total_play_time_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Skins table (all available skins in the game)
CREATE TABLE IF NOT EXISTS public.skins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'mythic')),
  unlock_condition TEXT,
  unlock_level INTEGER,
  unlock_victories INTEGER,
  image_url TEXT,
  sprite_data JSONB,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skins table (skins owned/unlocked by users)
CREATE TABLE IF NOT EXISTS public.user_skins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skin_id UUID NOT NULL REFERENCES public.skins(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  is_equipped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skin_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skins ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Game progress policies
CREATE POLICY "Users can view own progress"
  ON public.game_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.game_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Game stats policies
CREATE POLICY "Users can view own stats"
  ON public.game_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.game_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.game_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Skins policies (public read, admin write)
CREATE POLICY "Anyone can view skins"
  ON public.skins FOR SELECT
  USING (true);

-- User skins policies
CREATE POLICY "Users can view own skins"
  ON public.user_skins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skins"
  ON public.user_skins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skins"
  ON public.user_skins FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
-- This trigger fires when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_base_username TEXT;
BEGIN
  -- Get username from metadata or generate from email
  v_base_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  
  -- Clean username: remove invalid characters, keep only alphanumeric and underscore
  v_username := regexp_replace(v_base_username, '[^a-zA-Z0-9_]', '', 'g');
  
  -- Ensure minimum length (pad with numbers if needed)
  IF char_length(v_username) < 3 THEN
    v_username := v_username || '123';
  END IF;
  
  -- Ensure maximum length
  IF char_length(v_username) > 30 THEN
    v_username := substring(v_username FROM 1 FOR 30);
  END IF;
  
  -- If username is still invalid, use a default based on user ID
  IF v_username IS NULL OR v_username = '' THEN
    v_username := 'user' || substring(replace(NEW.id::text, '-', '') FROM 1 FOR 8);
  END IF;
  
  -- Create profile record linked to auth.users
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, v_username);
  
  -- Initialize game progress (level 1, 0 victories)
  INSERT INTO public.game_progress (user_id, level, victories)
  VALUES (NEW.id, 1, 0);
  
  -- Initialize game stats (all zeros)
  INSERT INTO public.game_stats (user_id)
  VALUES (NEW.id);
  
  -- Default skin will be unlocked by trigger on_profile_created_unlock_skin
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
-- Automatically runs when a new user signs up via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- HELPER FUNCTIONS (Optional - for easier queries)
-- ============================================================================

-- Function to get complete user data (auth + profile + progress + stats)
-- Usage: SELECT * FROM get_user_data('user-uuid');
CREATE OR REPLACE FUNCTION public.get_user_data(p_user_id UUID)
RETURNS TABLE (
  auth_id UUID,
  email TEXT,
  username TEXT,
  level INTEGER,
  victories INTEGER,
  total_games_played INTEGER,
  highest_level_reached INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as auth_id,
    p.email,
    p.username,
    COALESCE(gp.level, 1) as level,
    COALESCE(gp.victories, 0) as victories,
    COALESCE(gs.total_games_played, 0) as total_games_played,
    COALESCE(gs.highest_level_reached, 1) as highest_level_reached
  FROM public.profiles p
  LEFT JOIN public.game_progress gp ON p.id = gp.user_id
  LEFT JOIN public.game_stats gs ON p.id = gs.user_id
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_game_progress_updated_at
  BEFORE UPDATE ON public.game_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_game_stats_updated_at
  BEFORE UPDATE ON public.game_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_skins_updated_at
  BEFORE UPDATE ON public.skins
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to unlock default skin for new users
CREATE OR REPLACE FUNCTION public.unlock_default_skin()
RETURNS TRIGGER AS $$
DECLARE
  default_skin_id UUID;
BEGIN
  -- Find the default skin
  SELECT id INTO default_skin_id
  FROM public.skins
  WHERE is_default = true
  LIMIT 1;
  
  -- If default skin exists, unlock it for the new user
  IF default_skin_id IS NOT NULL THEN
    INSERT INTO public.user_skins (user_id, skin_id, is_equipped)
    VALUES (NEW.id, default_skin_id, true)
    ON CONFLICT (user_id, skin_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to unlock default skin on user creation
DROP TRIGGER IF EXISTS on_profile_created_unlock_skin ON public.profiles;
CREATE TRIGGER on_profile_created_unlock_skin
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.unlock_default_skin();

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert default skin (must be run after tables are created)
INSERT INTO public.skins (name, display_name, description, rarity, is_default, unlock_condition)
VALUES (
  'default',
  'Skin Padrão',
  'A skin clássica do jogo',
  'common',
  true,
  'Disponível desde o início'
) ON CONFLICT (name) DO NOTHING;

-- Example: Level-based unlock skins
INSERT INTO public.skins (name, display_name, description, rarity, unlock_level, unlock_condition)
VALUES 
  (
    'level_5',
    'Veterano',
    'Desbloqueado ao completar o nível 5',
    'rare',
    5,
    'Completar nível 5'
  ),
  (
    'level_10',
    'Mestre',
    'Desbloqueado ao completar o nível 10',
    'epic',
    10,
    'Completar nível 10'
  )
ON CONFLICT (name) DO NOTHING;

-- Example: Victory-based unlock skins
INSERT INTO public.skins (name, display_name, description, rarity, unlock_victories, unlock_condition)
VALUES 
  (
    'victory_1',
    'Primeiro Título',
    'Desbloqueado com 1 vitória',
    'common',
    1,
    'Ganhar 1 vitória'
  ),
  (
    'victory_5',
    'Campeão',
    'Desbloqueado com 5 vitórias',
    'rare',
    5,
    'Ganhar 5 vitórias'
  ),
  (
    'victory_10',
    'Lendário',
    'Desbloqueado com 10 vitórias',
    'legendary',
    10,
    'Ganhar 10 vitórias'
  )
ON CONFLICT (name) DO NOTHING;

