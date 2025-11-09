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

-- ============================================================================
-- MYTHIC RAINBOW SKINS (Míticas com fundo arco-íris)
-- ============================================================================

-- Mythic Rainbow Skin 1 (Legendary - Mítica com Shiny/Holo)
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
  'Uma skin lendária com fundo arco-íris animado e efeitos shiny/holo',
  'legendary',
  20,
  'Completar nível 20',
  jsonb_build_object(
    'css', '/* Mythic Rainbow Skin - Tema Arco-íris Mítico com Shiny/Holo */
.skin-mythic-rainbow-1 {
  --player-color: #ff0000;
  --player-glow: #00ff00;
  --boss-color: #0000ff;
  --boss-arm-color: #6600cc;
  --boss-weakspot-color: #ffff00;
  --player-bullet-color: #ffffff;
  --boss-bullet-color: #ff00ff;
  --heart-color: #ff0066;
  --background-color: #000000;
  --space: 5%;
  --angle: 133deg;
  --sunpillar-clr-1: rgba(255, 255, 255, 0.1);
  --sunpillar-clr-2: rgba(255, 0, 255, 0.15);
  --sunpillar-clr-3: rgba(0, 255, 255, 0.2);
  --sunpillar-clr-4: rgba(255, 255, 0, 0.15);
  --sunpillar-clr-5: rgba(255, 0, 128, 0.2);
  --sunpillar-clr-6: rgba(128, 0, 255, 0.15);
}

.skin-mythic-rainbow-1 .player {
  position: relative;
  background: linear-gradient(90deg, 
    #ff0000 0%, 
    #ff7f00 8%, 
    #ffff00 16%, 
    #00ff00 24%, 
    #00ffff 32%, 
    #0000ff 40%, 
    #4b0082 48%, 
    #9400d3 56%, 
    #ff1493 64%, 
    #ff0000 72%, 
    #ff7f00 80%, 
    #ffff00 88%, 
    #00ff00 96%, 
    #ff0000 100%);
  background-size: 300% 100%;
  animation: mythic-rainbow-flow 1.5s linear infinite;
  box-shadow: 
    0 0 20px rgba(255, 255, 255, 0.6),
    0 0 40px rgba(255, 0, 255, 0.4),
    0 0 60px rgba(0, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

.skin-mythic-rainbow-1 .player::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(0deg, 
      var(--sunpillar-clr-1) calc(var(--space)*1), 
      var(--sunpillar-clr-2) calc(var(--space)*2), 
      var(--sunpillar-clr-3) calc(var(--space)*3), 
      var(--sunpillar-clr-4) calc(var(--space)*4), 
      var(--sunpillar-clr-5) calc(var(--space)*5), 
      var(--sunpillar-clr-6) calc(var(--space)*6), 
      var(--sunpillar-clr-1) calc(var(--space)*7)
    ),
    repeating-linear-gradient(var(--angle), 
      #0e152e 0%, 
      hsl(180, 10%, 60%) 3.8%, 
      hsl(180, 29%, 66%) 4.5%, 
      hsl(180, 10%, 60%) 5.2%, 
      #0e152e 10%, 
      #0e152e 12%
    );
  background-position: 0% var(--shine-y), calc(var(--shine-x) + (var(--shine-y)*0.2)) var(--shine-y);
  background-size: 200% 700%, 300% 100%;
  background-blend-mode: hue, hard-light;
  animation: mythic-shine-move 3s linear infinite;
  filter: brightness(0.6) contrast(1.4) saturate(2.25);
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.skin-mythic-rainbow-1 .player::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(0deg, 
      var(--sunpillar-clr-1) calc(var(--space)*1), 
      var(--sunpillar-clr-2) calc(var(--space)*2), 
      var(--sunpillar-clr-3) calc(var(--space)*3), 
      var(--sunpillar-clr-4) calc(var(--space)*4), 
      var(--sunpillar-clr-5) calc(var(--space)*5), 
      var(--sunpillar-clr-6) calc(var(--space)*6), 
      var(--sunpillar-clr-1) calc(var(--space)*7)
    ),
    repeating-linear-gradient(var(--angle), 
      #0e152e 0%, 
      hsl(180, 10%, 60%) 3.8%, 
      hsl(180, 29%, 66%) 4.5%, 
      hsl(180, 10%, 60%) 5.2%, 
      #0e152e 10%, 
      #0e152e 12%
    );
  background-position: 0% var(--shine-y), calc((var(--shine-x) + (var(--shine-y)*0.2)) * -1) calc(var(--shine-y) * -1);
  background-size: 200% 400%, 195% 100%;
  background-blend-mode: hue, hard-light;
  animation: mythic-shine-move-reverse 3s linear infinite;
  filter: brightness(0.8) contrast(1.5) saturate(1.25);
  mix-blend-mode: exclusion;
  pointer-events: none;
}

@keyframes mythic-shine-move {
  0% { 
    --shine-x: 0%;
    --shine-y: 0%;
  }
  25% { 
    --shine-x: 100%;
    --shine-y: 25%;
  }
  50% { 
    --shine-x: 50%;
    --shine-y: 100%;
  }
  75% { 
    --shine-x: 0%;
    --shine-y: 75%;
  }
  100% { 
    --shine-x: 0%;
    --shine-y: 0%;
  }
}

@keyframes mythic-shine-move-reverse {
  0% { 
    --shine-x: 100%;
    --shine-y: 100%;
  }
  25% { 
    --shine-x: 0%;
    --shine-y: 75%;
  }
  50% { 
    --shine-x: 50%;
    --shine-y: 0%;
  }
  75% { 
    --shine-x: 100%;
    --shine-y: 25%;
  }
  100% { 
    --shine-x: 100%;
    --shine-y: 100%;
  }
}

@keyframes mythic-rainbow-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 300% 50%; }
}

.skin-mythic-rainbow-1 .boss {
  position: relative;
  background: linear-gradient(90deg, 
    #0000ff 0%, 
    #ff00ff 25%, 
    #ff0080 50%, 
    #ff00ff 75%, 
    #0000ff 100%);
  background-size: 200% 100%;
  animation: mythic-rainbow-boss 2s linear infinite;
  box-shadow: 
    0 0 30px rgba(255, 0, 255, 0.8),
    0 0 60px rgba(0, 255, 255, 0.5);
  border: 2px solid rgba(255, 0, 255, 0.6);
  overflow: hidden;
}

.skin-mythic-rainbow-1 .boss::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(var(--angle), 
      #0e152e 0%, 
      hsl(300, 10%, 60%) 3.8%, 
      hsl(300, 29%, 66%) 4.5%, 
      hsl(300, 10%, 60%) 5.2%, 
      #0e152e 10%, 
      #0e152e 12%
    );
  background-position: calc(var(--shine-x) + (var(--shine-y)*0.2)) var(--shine-y);
  background-size: 300% 100%;
  background-blend-mode: hard-light;
  animation: mythic-shine-move 4s linear infinite;
  filter: brightness(0.5) contrast(1.6) saturate(2.5);
  mix-blend-mode: soft-light;
  pointer-events: none;
}

@keyframes mythic-rainbow-boss {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.skin-mythic-rainbow-1 .boss-weakspot {
  position: relative;
  background: radial-gradient(circle, #ffff00, #ffaa00, #ff00ff);
  animation: mythic-rainbow-weakspot 0.8s infinite;
  box-shadow: 
    0 0 40px #ffff00,
    0 0 80px rgba(255, 255, 0, 0.6);
  overflow: hidden;
}

.skin-mythic-rainbow-1 .boss-weakspot::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, 
    hsl(60, 100%, 100%) 0%, 
    hsla(60, 100%, 50%, 0) 40%);
  mix-blend-mode: overlay;
  opacity: 0.75;
  animation: mythic-glare-pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes mythic-glare-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.2); }
}

@keyframes mythic-rainbow-weakspot {
  0%, 100% { 
    filter: hue-rotate(0deg) brightness(1.2);
    transform: scale(1);
  }
  50% { 
    filter: hue-rotate(180deg) brightness(1.5);
    transform: scale(1.15);
  }
}',
    'type', 'css',
    'theme', 'mythic-rainbow'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

-- Mythic Rainbow Skin 2 (Legendary - Mítica com Shiny/Holo)
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
  'Uma skin lendária com fundo arco-íris cósmico e efeitos shiny/holo',
  'legendary',
  20,
  'Ganhar 20 vitórias',
  jsonb_build_object(
    'css', '/* Mythic Cosmic Rainbow Skin - Tema Arco-íris Cósmico com Shiny/Holo */
.skin-mythic-rainbow-2 {
  --player-color: #ff0080;
  --player-glow: #00ffff;
  --boss-color: #8000ff;
  --boss-arm-color: #4000ff;
  --boss-weakspot-color: #ffff00;
  --player-bullet-color: #ffffff;
  --boss-bullet-color: #ff00ff;
  --heart-color: #ff0066;
  --background-color: #000000;
  --space: 5%;
  --angle: 133deg;
  --sunpillar-clr-1: rgba(255, 0, 128, 0.12);
  --sunpillar-clr-2: rgba(0, 255, 255, 0.18);
  --sunpillar-clr-3: rgba(128, 0, 255, 0.22);
  --sunpillar-clr-4: rgba(255, 0, 255, 0.18);
  --sunpillar-clr-5: rgba(255, 255, 0, 0.22);
  --sunpillar-clr-6: rgba(0, 255, 128, 0.15);
}

.skin-mythic-rainbow-2 .player {
  position: relative;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255, 0, 128, 0.8), transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(0, 255, 255, 0.8), transparent 50%),
    linear-gradient(135deg, 
      #ff0080 0%, 
      #ff00ff 14%, 
      #8000ff 28%, 
      #0080ff 42%, 
      #00ffff 57%, 
      #00ff80 71%, 
      #80ff00 85%, 
      #ff8000 100%);
  background-size: 200% 200%, 200% 200%, 250% 100%;
  animation: 
    mythic-cosmic-shift 4s ease-in-out infinite,
    mythic-cosmic-flow 2s linear infinite;
  box-shadow: 
    0 0 25px rgba(255, 0, 128, 0.8),
    0 0 50px rgba(0, 255, 255, 0.6),
    0 0 75px rgba(128, 0, 255, 0.4),
    inset 0 0 30px rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.6);
  overflow: hidden;
}

.skin-mythic-rainbow-2 .player::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(0deg, 
      var(--sunpillar-clr-1) calc(var(--space)*1), 
      var(--sunpillar-clr-2) calc(var(--space)*2), 
      var(--sunpillar-clr-3) calc(var(--space)*3), 
      var(--sunpillar-clr-4) calc(var(--space)*4), 
      var(--sunpillar-clr-5) calc(var(--space)*5), 
      var(--sunpillar-clr-6) calc(var(--space)*6), 
      var(--sunpillar-clr-1) calc(var(--space)*7)
    ),
    repeating-linear-gradient(var(--angle), 
      #0e152e 0%, 
      hsl(300, 10%, 60%) 3.8%, 
      hsl(300, 29%, 66%) 4.5%, 
      hsl(300, 10%, 60%) 5.2%, 
      #0e152e 10%, 
      #0e152e 12%
    ),
    radial-gradient(farthest-corner circle at var(--shine-x) var(--shine-y),
      hsla(0, 0%, 0%, 0.1) 12%, 
      hsla(0, 0%, 0%, 0.15) 20%, 
      hsla(0, 0%, 0%, 0.25) 120%
    );
  background-position: 
    0% var(--shine-y), 
    calc(var(--shine-x) + (var(--shine-y)*0.2)) var(--shine-y), 
    var(--shine-x) var(--shine-y);
  background-size: 200% 700%, 300% 100%, 200% 100%;
  background-blend-mode: soft-light, hue, hard-light;
  animation: mythic-cosmic-shine-move 3.5s linear infinite;
  filter: brightness(calc((var(--shine-intensity)*0.4) + .4)) contrast(1.4) saturate(2.25);
  pointer-events: none;
}

.skin-mythic-rainbow-2 .player::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(0deg, 
      var(--sunpillar-clr-1) calc(var(--space)*1), 
      var(--sunpillar-clr-2) calc(var(--space)*2), 
      var(--sunpillar-clr-3) calc(var(--space)*3), 
      var(--sunpillar-clr-4) calc(var(--space)*4), 
      var(--sunpillar-clr-5) calc(var(--space)*5), 
      var(--sunpillar-clr-6) calc(var(--space)*6), 
      var(--sunpillar-clr-1) calc(var(--space)*7)
    ),
    repeating-linear-gradient(var(--angle), 
      #0e152e 0%, 
      hsl(300, 10%, 60%) 3.8%, 
      hsl(300, 29%, 66%) 4.5%, 
      hsl(300, 10%, 60%) 5.2%, 
      #0e152e 10%, 
      #0e152e 12%
    );
  background-position: 
    0% var(--shine-y), 
    calc((var(--shine-x) + (var(--shine-y)*0.2)) * -1) calc(var(--shine-y) * -1);
  background-size: 200% 400%, 195% 100%;
  background-blend-mode: hue, hard-light;
  animation: mythic-cosmic-shine-move-reverse 3.5s linear infinite;
  filter: brightness(calc((var(--shine-intensity)*.4) + .8)) contrast(1.5) saturate(1.25);
  mix-blend-mode: exclusion;
  pointer-events: none;
}

@keyframes mythic-cosmic-shine-move {
  0% { 
    --shine-x: 0%;
    --shine-y: 0%;
    --shine-intensity: 0.5;
  }
  25% { 
    --shine-x: 100%;
    --shine-y: 30%;
    --shine-intensity: 1;
  }
  50% { 
    --shine-x: 50%;
    --shine-y: 100%;
    --shine-intensity: 0.7;
  }
  75% { 
    --shine-x: 0%;
    --shine-y: 70%;
    --shine-intensity: 0.9;
  }
  100% { 
    --shine-x: 0%;
    --shine-y: 0%;
    --shine-intensity: 0.5;
  }
}

@keyframes mythic-cosmic-shine-move-reverse {
  0% { 
    --shine-x: 100%;
    --shine-y: 100%;
    --shine-intensity: 0.8;
  }
  25% { 
    --shine-x: 0%;
    --shine-y: 70%;
    --shine-intensity: 1;
  }
  50% { 
    --shine-x: 50%;
    --shine-y: 0%;
    --shine-intensity: 0.6;
  }
  75% { 
    --shine-x: 100%;
    --shine-y: 30%;
    --shine-intensity: 0.9;
  }
  100% { 
    --shine-x: 100%;
    --shine-y: 100%;
    --shine-intensity: 0.8;
  }
}

@keyframes mythic-cosmic-shift {
  0%, 100% { 
    background-position: 0% 0%, 100% 100%, 0% 50%;
  }
  50% { 
    background-position: 100% 100%, 0% 0%, 100% 50%;
  }
}

@keyframes mythic-cosmic-flow {
  0% { background-position: 0% 50%; }
  100% { background-position: 250% 50%; }
}

.skin-mythic-rainbow-2 .boss {
  position: relative;
  background: 
    radial-gradient(circle at 50% 50%, rgba(128, 0, 255, 0.6), transparent 70%),
    linear-gradient(90deg, 
      #8000ff 0%, 
      #ff00ff 33%, 
      #ff0080 66%, 
      #8000ff 100%);
  background-size: 150% 150%, 200% 100%;
  animation: mythic-cosmic-boss 2.5s linear infinite;
  box-shadow: 
    0 0 35px rgba(128, 0, 255, 0.9),
    0 0 70px rgba(255, 0, 255, 0.6),
    inset 0 0 40px rgba(255, 0, 128, 0.3);
  border: 2px solid rgba(255, 0, 255, 0.7);
  overflow: hidden;
}

.skin-mythic-rainbow-2 .boss::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(var(--angle), 
      #0e152e 0%, 
      hsl(300, 10%, 60%) 3.8%, 
      hsl(300, 29%, 66%) 4.5%, 
      hsl(300, 10%, 60%) 5.2%, 
      #0e152e 10%, 
      #0e152e 12%
    );
  background-position: calc(var(--shine-x) + (var(--shine-y)*0.2)) var(--shine-y);
  background-size: 300% 100%;
  background-blend-mode: hard-light;
  animation: mythic-cosmic-shine-move 4s linear infinite;
  filter: brightness(0.5) contrast(1.6) saturate(2.5);
  mix-blend-mode: soft-light;
  pointer-events: none;
}

@keyframes mythic-cosmic-boss {
  0% { 
    background-position: 0% 0%, 0% 50%;
    filter: hue-rotate(0deg);
  }
  100% { 
    background-position: 100% 100%, 200% 50%;
    filter: hue-rotate(360deg);
  }
}

.skin-mythic-rainbow-2 .boss-weakspot {
  position: relative;
  background: 
    radial-gradient(circle, #ffff00 0%, #ffaa00 30%, #ff00ff 60%, #00ffff 100%);
  animation: mythic-cosmic-weakspot 1s infinite;
  box-shadow: 
    0 0 50px #ffff00,
    0 0 100px rgba(255, 255, 0, 0.8),
    0 0 150px rgba(255, 0, 255, 0.5);
  overflow: hidden;
}

.skin-mythic-rainbow-2 .boss-weakspot::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, 
    hsl(60, 100%, 100%) 0%, 
    hsla(60, 100%, 50%, 0) 40%);
  mix-blend-mode: overlay;
  opacity: 0.75;
  animation: mythic-cosmic-glare-pulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

.skin-mythic-rainbow-2 .boss-weakspot::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    repeating-linear-gradient(var(--angle), 
      #0e152e 0%, 
      hsl(60, 29%, 66%) 4.5%, 
      #0e152e 10%
    );
  background-position: calc(var(--shine-x) + (var(--shine-y)*0.2)) var(--shine-y);
  background-size: 200% 100%;
  background-blend-mode: hard-light;
  animation: mythic-cosmic-shine-move 2s linear infinite;
  filter: brightness(0.6) contrast(2) saturate(1.5);
  mix-blend-mode: difference;
  pointer-events: none;
}

@keyframes mythic-cosmic-glare-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.2); }
}

@keyframes mythic-cosmic-weakspot {
  0%, 100% { 
    filter: hue-rotate(0deg) brightness(1.3) saturate(1.5);
    transform: scale(1) rotate(0deg);
  }
  25% { 
    filter: hue-rotate(90deg) brightness(1.5) saturate(1.8);
    transform: scale(1.1) rotate(90deg);
  }
  50% { 
    filter: hue-rotate(180deg) brightness(1.4) saturate(1.6);
    transform: scale(1.2) rotate(180deg);
  }
  75% { 
    filter: hue-rotate(270deg) brightness(1.5) saturate(1.8);
    transform: scale(1.1) rotate(270deg);
  }
}',
    'type', 'css',
    'theme', 'mythic-cosmic-rainbow'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;

