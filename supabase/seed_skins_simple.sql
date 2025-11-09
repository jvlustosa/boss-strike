-- ============================================================================
-- SIMPLIFIED SKINS SEED
-- References CSS classes from src/skins/all-skins.css
-- Only stores texture_name reference, not full CSS
-- ============================================================================

-- Fire Skin (Epic)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'fire_skin',
  'Skin de Fogo',
  'Uma skin com tema de fogo e animações de chama',
  'epic',
  5,
  'Completar nível 5',
  jsonb_build_object(
    'texture_name', 'fire',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Ice Skin (Rare)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'ice_skin',
  'Skin de Gelo',
  'Uma skin com tema de gelo e efeitos de brilho',
  'rare',
  3,
  'Completar nível 3',
  jsonb_build_object(
    'texture_name', 'ice',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Neon Skin (Epic)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'neon_skin',
  'Skin Neon',
  'Uma skin cyberpunk com efeitos neon',
  'epic',
  7,
  'Completar nível 7',
  jsonb_build_object(
    'texture_name', 'neon',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Rainbow Skin (Rare)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'rainbow_skin',
  'Skin Arco-íris',
  'Uma skin com tema arco-íris animado',
  'rare',
  5,
  'Ganhar 5 vitórias',
  jsonb_build_object(
    'texture_name', 'rainbow',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Gold Skin (Legendary)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'gold_skin',
  'Skin Dourada',
  'Uma skin premium com tema dourado',
  'legendary',
  10,
  'Ganhar 10 vitórias',
  jsonb_build_object(
    'texture_name', 'gold',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Void Skin (Epic)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'void_skin',
  'Skin do Vazio',
  'Uma skin escura com tema do vazio',
  'epic',
  10,
  'Completar nível 10',
  jsonb_build_object(
    'texture_name', 'void',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- ============================================================================
-- MYTHIC SKINS (Most Rare - Highest Rarity)
-- ============================================================================

-- Mythic Rainbow Skin 1 (Mythic - Most Rare)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'mythic_rainbow_1',
  'Skin Mítica Arco-íris',
  'A skin mais rara com fundo arco-íris animado e efeitos shiny/holo especiais',
  'mythic',
  25,
  'Completar nível 25',
  jsonb_build_object(
    'texture_name', 'mythic-rainbow-1',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Mythic Rainbow Skin 2 (Mythic - Most Rare)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'mythic_rainbow_2',
  'Skin Mítica Cósmica',
  'A skin mais rara com fundo arco-íris cósmico e efeitos shiny/holo avançados',
  'mythic',
  25,
  'Ganhar 25 vitórias',
  jsonb_build_object(
    'texture_name', 'mythic-rainbow-2',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

