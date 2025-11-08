-- ============================================================================
-- DEPRECATED: This file is kept for reference only
-- All skins data is now included in seed.sql
-- ============================================================================
-- 
-- Example skins data
-- This data is now automatically included in seed.sql
-- You don't need to run this file separately

-- Default skin (always available)
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

