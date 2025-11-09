-- ============================================================================
-- 12 SKINS WITH DIFFERENT RARITIES AND EFFECTS
-- References CSS classes from src/skins/all-skins.css
-- Only stores texture_name reference, not full CSS
-- ============================================================================

-- ============================================================================
-- COMMON RARITY SKINS (3 skins)
-- ============================================================================

-- Common Skin 1: Basic Blue
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'basic_blue_skin',
  'Skin Azul Básica',
  'Uma skin simples com cor azul clássica',
  'common',
  1,
  'Início do jogo',
  jsonb_build_object(
    'texture_name', 'basic-blue',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Common Skin 2: Basic Red
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'basic_red_skin',
  'Skin Vermelha Básica',
  'Uma skin simples com cor vermelha clássica',
  'common',
  1,
  'Início do jogo',
  jsonb_build_object(
    'texture_name', 'basic-red',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Common Skin 3: Basic Green
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'basic_green_skin',
  'Skin Verde Básica',
  'Uma skin simples com cor verde clássica',
  'common',
  1,
  'Início do jogo',
  jsonb_build_object(
    'texture_name', 'basic-green',
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
-- RARE RARITY SKINS (3 skins)
-- ============================================================================

-- Rare Skin 1: Ice (with reverse-holo effect)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'ice_rare_skin',
  'Skin de Gelo Rara',
  'Uma skin gelada com efeito holográfico reverso',
  'rare',
  3,
  'Completar nível 3',
  jsonb_build_object(
    'texture_name', 'ice',
    'type', 'css-class',
    'effect', 'reverse-holo'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Rare Skin 2: Shiny Rare
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'shiny_rare_skin',
  'Skin Brilhante Rara',
  'Uma skin com efeito shiny raro e brilho especial',
  'rare',
  5,
  'Ganhar 5 vitórias',
  jsonb_build_object(
    'texture_name', 'basic-blue',
    'type', 'css-class',
    'effect', 'shiny-rare'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Rare Skin 3: Regular Holo
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'regular_holo_skin',
  'Skin Holográfica Regular',
  'Uma skin com efeito holográfico clássico',
  'rare',
  4,
  'Completar nível 4',
  jsonb_build_object(
    'texture_name', 'basic-green',
    'type', 'css-class',
    'effect', 'regular-holo'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- ============================================================================
-- EPIC RARITY SKINS (3 skins)
-- ============================================================================

-- Epic Skin 1: Fire (with V-Max effect)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'fire_epic_skin',
  'Skin de Fogo Épica',
  'Uma skin flamejante com efeito V-Max poderoso',
  'epic',
  7,
  'Completar nível 7',
  jsonb_build_object(
    'texture_name', 'fire',
    'type', 'css-class',
    'effect', 'v-max'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Epic Skin 2: Neon (with Shiny V effect)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'neon_epic_skin',
  'Skin Neon Épica',
  'Uma skin cyberpunk neon com efeito Shiny V',
  'epic',
  8,
  'Ganhar 8 vitórias',
  jsonb_build_object(
    'texture_name', 'neon',
    'type', 'css-class',
    'effect', 'shiny-v'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Epic Skin 3: Void (with Rainbow Holo effect)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'void_epic_skin',
  'Skin do Vazio Épica',
  'Uma skin sombria do vazio com efeito holográfico arco-íris',
  'epic',
  9,
  'Completar nível 9',
  jsonb_build_object(
    'texture_name', 'void',
    'type', 'css-class',
    'effect', 'rainbow-holo'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- ============================================================================
-- LEGENDARY RARITY SKINS (2 skins)
-- ============================================================================

-- Legendary Skin 1: Gold (with Radiant Holo effect)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'gold_legendary_skin',
  'Skin Dourada Lendária',
  'Uma skin dourada premium com efeito holográfico radiante',
  'legendary',
  12,
  'Completar nível 12',
  jsonb_build_object(
    'texture_name', 'gold',
    'type', 'css-class',
    'effect', 'radiant-holo'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Legendary Skin 2: Rainbow (with Cosmos Holo effect)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'rainbow_legendary_skin',
  'Skin Arco-íris Lendária',
  'Uma skin arco-íris animada com efeito holográfico cósmico',
  'legendary',
  15,
  'Ganhar 15 vitórias',
  jsonb_build_object(
    'texture_name', 'rainbow',
    'type', 'css-class',
    'effect', 'cosmos-holo'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Legendary Skin 3: Secret Rare
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'secret_rare_legendary_skin',
  'Skin Secreta Rara Lendária',
  'Uma skin ultra rara com efeito secreto especial',
  'legendary',
  15,
  20,
  'Completar nível 15 E ganhar 20 vitórias',
  jsonb_build_object(
    'texture_name', 'basic',
    'type', 'css-class',
    'effect', 'secret-rare'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- ============================================================================
-- MYTHIC RARITY SKINS (1 skin)
-- ============================================================================

-- Mythic Skin: Mythic Rainbow 1
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'mythic_rainbow_1',
  'Skin Mítica Arco-íris I',
  'A skin mais rara com efeitos arco-íris míticos e shiny/holo avançados',
  'mythic',
  20,
  30,
  'Completar nível 20 E ganhar 30 vitórias',
  jsonb_build_object(
    'texture_name', 'mythic-rainbow-1',
    'type', 'css-class'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total: 12 skins
-- - Common: 3 skins
-- - Rare: 3 skins
-- - Epic: 3 skins
-- - Legendary: 3 skins
-- - Mythic: 1 skin (most rare)
-- ============================================================================

