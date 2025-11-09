-- ============================================================================
-- UPDATE SKINS - EMOJI BULLETS AND SMILEY SKIN
-- Updates existing skins and adds new smiley skin
-- ============================================================================

-- ============================================================================
-- UPDATE EXISTING SKINS
-- ============================================================================

-- Update Fire Skin to ensure it has correct texture_name for emoji bullets
UPDATE public.skins
SET 
  sprite_data = jsonb_build_object(
    'texture_name', 'fire',
    'type', 'css-class',
    'effect', COALESCE(sprite_data->>'effect', 'basic-effects')
  )
WHERE (name = 'fire_skin' OR name LIKE '%fire%') 
  AND (sprite_data->>'texture_name' IS NULL OR sprite_data->>'texture_name' != 'fire');

-- Update Ice Skin to ensure it has correct texture_name for emoji bullets
UPDATE public.skins
SET 
  sprite_data = jsonb_build_object(
    'texture_name', 'ice',
    'type', 'css-class',
    'effect', COALESCE(sprite_data->>'effect', 'basic-effects')
  )
WHERE (name = 'ice_skin' OR name LIKE '%ice%')
  AND (sprite_data->>'texture_name' IS NULL OR sprite_data->>'texture_name' != 'ice');

-- ============================================================================
-- INSERT/UPDATE SMILEY SKIN
-- ============================================================================

-- Smiley Skin (Common) - Emoji trail effect
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'smiley_skin',
  'Skin Smiley',
  'Uma skin divertida com rastro de emojis aleatórios! 😀',
  'common',
  1,
  'Início do jogo',
  jsonb_build_object(
    'texture_name', 'smiley',
    'type', 'css-class',
    'effect', 'basic-effects'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data,
  updated_at = NOW();

-- Smiley Skin (Rare) - With holo effect
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'smiley_rare_skin',
  'Skin Smiley Rara',
  'Uma skin smiley rara com efeito holográfico e rastro de emojis! ✨😀',
  'rare',
  5,
  'Ganhar 5 vitórias',
  jsonb_build_object(
    'texture_name', 'smiley',
    'type', 'css-class',
    'effect', 'regular-holo'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data,
  updated_at = NOW();

-- Smiley Skin (Epic) - With shiny effect
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'smiley_epic_skin',
  'Skin Smiley Épica',
  'Uma skin smiley épica com efeito brilhante e rastro de emojis! 🌟😀',
  'epic',
  10,
  'Completar nível 10',
  jsonb_build_object(
    'texture_name', 'smiley',
    'type', 'css-class',
    'effect', 'shiny-rare'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data,
  updated_at = NOW();

-- ============================================================================
-- VERIFICATION QUERIES (Optional - for checking updates)
-- ============================================================================

-- Check fire and ice skins
-- SELECT name, display_name, sprite_data->>'texture_name' as texture_name 
-- FROM public.skins 
-- WHERE name LIKE '%fire%' OR name LIKE '%ice%';

-- Check smiley skins
-- SELECT name, display_name, rarity, sprite_data->>'texture_name' as texture_name 
-- FROM public.skins 
-- WHERE name LIKE '%smiley%';

