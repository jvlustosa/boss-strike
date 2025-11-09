-- ============================================================================
-- EXTENDED SKINS SEED
-- Adiciona mais skins coloridas e animadas ao banco de dados
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
    'css', '/* Fire Skin - Tema de Fogo */
.skin-fire {
  --player-color: #ff4400;
  --player-glow: #ff8800;
  --boss-color: #cc0000;
  --boss-arm-color: #990000;
  --boss-weakspot-color: #ffaa00;
  --player-bullet-color: #ff6600;
  --boss-bullet-color: #ff3300;
  --heart-color: #ff0066;
  --background-color: #1a0000;
}

.skin-fire .player {
  background: linear-gradient(135deg, var(--player-color), var(--player-glow));
  box-shadow: 0 0 10px var(--player-glow), 0 0 20px var(--player-glow);
  animation: fire-flicker 0.3s infinite alternate;
}

@keyframes fire-flicker {
  0% { filter: brightness(1); }
  100% { filter: brightness(1.2); }
}

.skin-fire .boss {
  background: linear-gradient(135deg, var(--boss-color), #880000);
  box-shadow: 0 0 15px rgba(255, 68, 0, 0.5);
}

.skin-fire .boss-weakspot {
  background: radial-gradient(circle, var(--boss-weakspot-color), #cc8800);
  animation: pulse-fire 1s infinite;
}

@keyframes pulse-fire {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}',
    'type', 'css',
    'theme', 'fire'
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
    'css', '/* Ice Skin - Tema de Gelo */
.skin-ice {
  --player-color: #00ccff;
  --player-glow: #66ddff;
  --boss-color: #0066cc;
  --boss-arm-color: #004499;
  --boss-weakspot-color: #ffffff;
  --player-bullet-color: #88eeff;
  --boss-bullet-color: #0088ff;
  --heart-color: #ff0066;
  --background-color: #000033;
}

.skin-ice .player {
  background: linear-gradient(135deg, var(--player-color), var(--player-glow));
  box-shadow: 0 0 15px var(--player-glow), 0 0 30px rgba(102, 221, 255, 0.3);
  animation: ice-shimmer 2s infinite;
}

@keyframes ice-shimmer {
  0%, 100% { filter: brightness(1) hue-rotate(0deg); }
  50% { filter: brightness(1.1) hue-rotate(10deg); }
}

.skin-ice .boss {
  background: linear-gradient(135deg, var(--boss-color), #003366);
  box-shadow: 0 0 20px rgba(0, 204, 255, 0.4);
  border: 1px solid rgba(102, 221, 255, 0.3);
}

.skin-ice .boss-weakspot {
  background: radial-gradient(circle, var(--boss-weakspot-color), #aaccff);
  animation: ice-pulse 1.5s infinite;
}

@keyframes ice-pulse {
  0%, 100% { opacity: 1; filter: blur(0px); }
  50% { opacity: 0.9; filter: blur(1px); }
}',
    'type', 'css',
    'theme', 'ice'
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
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'neon_skin',
  'Skin Neon',
  'Uma skin cyberpunk com efeitos neon',
  'epic',
  5,
  'Ganhar 5 vitórias',
  jsonb_build_object(
    'css', '/* Neon Skin - Tema Neon Cyberpunk */
.skin-neon {
  --player-color: #00ff41;
  --player-glow: #39ff14;
  --boss-color: #ff00ff;
  --boss-arm-color: #cc00cc;
  --boss-weakspot-color: #ffff00;
  --player-bullet-color: #00ffff;
  --boss-bullet-color: #ff0080;
  --heart-color: #ff0066;
  --background-color: #0a0a0a;
}

.skin-neon .player {
  background: var(--player-color);
  box-shadow: 
    0 0 10px var(--player-glow),
    0 0 20px var(--player-glow),
    0 0 30px var(--player-glow),
    inset 0 0 10px rgba(57, 255, 20, 0.5);
  animation: neon-flicker 0.15s infinite alternate;
  border: 1px solid var(--player-glow);
}

@keyframes neon-flicker {
  0% { 
    box-shadow: 
      0 0 5px var(--player-glow),
      0 0 10px var(--player-glow),
      0 0 15px var(--player-glow);
  }
  100% { 
    box-shadow: 
      0 0 10px var(--player-glow),
      0 0 20px var(--player-glow),
      0 0 30px var(--player-glow),
      0 0 40px var(--player-glow);
  }
}

.skin-neon .boss {
  background: var(--boss-color);
  box-shadow: 
    0 0 15px #ff00ff,
    0 0 30px rgba(255, 0, 255, 0.5);
  border: 1px solid #ff00ff;
  animation: neon-pulse 1s infinite;
}

@keyframes neon-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
}

.skin-neon .boss-weakspot {
  background: var(--boss-weakspot-color);
  box-shadow: 0 0 20px #ffff00;
  animation: neon-weakspot 0.5s infinite alternate;
}

@keyframes neon-weakspot {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.8; transform: scale(1.05); }
}',
    'type', 'css',
    'theme', 'neon'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Rainbow Skin (Legendary)
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
  'Uma skin com cores animadas em gradiente',
  'legendary',
  10,
  'Ganhar 10 vitórias',
  jsonb_build_object(
    'css', '/* Rainbow Skin - Tema Arco-íris Animado */
.skin-rainbow {
  --player-color: #ff0000;
  --boss-color: #0000ff;
  --boss-arm-color: #6600cc;
  --boss-weakspot-color: #ffff00;
  --player-bullet-color: #ffffff;
  --boss-bullet-color: #ff00ff;
  --heart-color: #ff0066;
  --background-color: #000000;
}

.skin-rainbow .player {
  background: linear-gradient(90deg, 
    #ff0000 0%, 
    #ff7f00 14%, 
    #ffff00 28%, 
    #00ff00 42%, 
    #0000ff 57%, 
    #4b0082 71%, 
    #9400d3 85%, 
    #ff0000 100%);
  background-size: 200% 100%;
  animation: rainbow-flow 2s linear infinite;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

@keyframes rainbow-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.skin-rainbow .boss {
  background: linear-gradient(90deg, 
    #0000ff 0%, 
    #ff00ff 50%, 
    #0000ff 100%);
  background-size: 200% 100%;
  animation: rainbow-boss 3s linear infinite;
  box-shadow: 0 0 25px rgba(255, 0, 255, 0.6);
}

@keyframes rainbow-boss {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.skin-rainbow .boss-weakspot {
  background: radial-gradient(circle, #ffff00, #ffaa00);
  animation: rainbow-weakspot 1s infinite;
  box-shadow: 0 0 30px #ffff00;
}

@keyframes rainbow-weakspot {
  0%, 100% { 
    filter: hue-rotate(0deg);
    transform: scale(1);
  }
  50% { 
    filter: hue-rotate(180deg);
    transform: scale(1.1);
  }
}',
    'type', 'css',
    'theme', 'rainbow'
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
  unlock_level,
  unlock_condition,
  sprite_data
) VALUES (
  'gold_skin',
  'Skin Dourada',
  'Uma skin premium com tema dourado',
  'legendary',
  10,
  'Completar nível 10',
  jsonb_build_object(
    'css', '/* Gold Skin - Tema Dourado Premium */
.skin-gold {
  --player-color: #ffd700;
  --player-glow: #ffed4e;
  --boss-color: #8b6914;
  --boss-arm-color: #6b4e0a;
  --boss-weakspot-color: #ffaa00;
  --player-bullet-color: #fffacd;
  --boss-bullet-color: #daa520;
  --heart-color: #ff0066;
  --background-color: #1a1a00;
}

.skin-gold .player {
  background: linear-gradient(135deg, 
    #ffd700 0%, 
    #ffed4e 50%, 
    #ffd700 100%);
  box-shadow: 
    0 0 15px #ffd700,
    0 0 30px rgba(255, 215, 0, 0.6),
    inset 0 0 20px rgba(255, 237, 78, 0.3);
  animation: gold-shine 2s infinite;
  border: 1px solid #ffed4e;
}

@keyframes gold-shine {
  0%, 100% { 
    filter: brightness(1);
    box-shadow: 
      0 0 15px #ffd700,
      0 0 30px rgba(255, 215, 0, 0.6);
  }
  50% { 
    filter: brightness(1.3);
    box-shadow: 
      0 0 25px #ffd700,
      0 0 50px rgba(255, 215, 0, 0.8),
      0 0 75px rgba(255, 215, 0, 0.4);
  }
}

.skin-gold .boss {
  background: linear-gradient(135deg, #8b6914, #6b4e0a);
  box-shadow: 
    0 0 20px rgba(255, 215, 0, 0.4),
    inset 0 0 30px rgba(139, 105, 20, 0.5);
  border: 2px solid #daa520;
}

.skin-gold .boss-weakspot {
  background: radial-gradient(circle, #ffaa00, #cc8800);
  box-shadow: 0 0 25px #ffaa00;
  animation: gold-pulse 1.2s infinite;
}

@keyframes gold-pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    opacity: 0.9;
    transform: scale(1.08);
    filter: brightness(1.4);
  }
}',
    'type', 'css',
    'theme', 'gold'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Void Skin (Epic)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition,
  sprite_data
) VALUES (
  'void_skin',
  'Skin do Vazio',
  'Uma skin escura com efeitos do vazio',
  'epic',
  7,
  'Ganhar 7 vitórias',
  jsonb_build_object(
    'css', '/* Void Skin - Tema do Vazio Escuro */
.skin-void {
  --player-color: #6600ff;
  --player-glow: #9900ff;
  --boss-color: #330033;
  --boss-arm-color: #220022;
  --boss-weakspot-color: #ff00ff;
  --player-bullet-color: #aa00ff;
  --boss-bullet-color: #5500aa;
  --heart-color: #ff0066;
  --background-color: #000000;
}

.skin-void .player {
  background: radial-gradient(circle, var(--player-color), #330066);
  box-shadow: 
    0 0 20px var(--player-glow),
    0 0 40px rgba(153, 0, 255, 0.5),
    inset 0 0 30px rgba(102, 0, 255, 0.3);
  animation: void-pulse 1.5s infinite;
  border: 1px solid var(--player-glow);
}

@keyframes void-pulse {
  0%, 100% { 
    transform: scale(1);
    filter: brightness(1);
    box-shadow: 
      0 0 20px var(--player-glow),
      0 0 40px rgba(153, 0, 255, 0.5);
  }
  50% { 
    transform: scale(1.05);
    filter: brightness(1.2);
    box-shadow: 
      0 0 30px var(--player-glow),
      0 0 60px rgba(153, 0, 255, 0.7),
      0 0 90px rgba(153, 0, 255, 0.3);
  }
}

.skin-void .boss {
  background: radial-gradient(circle, #330033, #110011);
  box-shadow: 
    0 0 25px rgba(102, 0, 255, 0.3),
    inset 0 0 40px rgba(51, 0, 51, 0.8);
  border: 1px solid #550055;
}

.skin-void .boss-weakspot {
  background: radial-gradient(circle, #ff00ff, #cc00cc);
  box-shadow: 
    0 0 30px #ff00ff,
    0 0 60px rgba(255, 0, 255, 0.5);
  animation: void-weakspot 0.8s infinite;
}

@keyframes void-weakspot {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    opacity: 0.85;
    transform: scale(1.1);
    filter: brightness(1.5);
  }
}',
    'type', 'css',
    'theme', 'void'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Electric Skin (Rare)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition
) VALUES (
  'electric_skin',
  'Skin Elétrica',
  'Uma skin com tema elétrico e faíscas',
  'rare',
  4,
  'Completar nível 4'
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition;

-- Nature Skin (Common)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition
) VALUES (
  'nature_skin',
  'Skin da Natureza',
  'Uma skin verde com tema natural',
  'common',
  2,
  'Ganhar 2 vitórias'
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition;

-- Shadow Skin (Rare)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition
) VALUES (
  'shadow_skin',
  'Skin das Sombras',
  'Uma skin escura e misteriosa',
  'rare',
  6,
  'Completar nível 6'
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition;

-- Crystal Skin (Epic)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition
) VALUES (
  'crystal_skin',
  'Skin de Cristal',
  'Uma skin brilhante como cristal',
  'epic',
  8,
  'Ganhar 8 vitórias'
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition;

-- Plasma Skin (Legendary)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_level,
  unlock_condition
) VALUES (
  'plasma_skin',
  'Skin de Plasma',
  'Uma skin lendária com energia de plasma',
  'legendary',
  15,
  'Completar nível 15'
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition;

-- Cosmic Skin (Legendary)
INSERT INTO public.skins (
  name,
  display_name,
  description,
  rarity,
  unlock_victories,
  unlock_condition
) VALUES (
  'cosmic_skin',
  'Skin Cósmica',
  'Uma skin lendária inspirada no cosmos',
  'legendary',
  15,
  'Ganhar 15 vitórias'
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition;

