/**
 * Script utilitário para gerar SQL para inserir skins com CSS no Supabase
 * 
 * Execute este script para gerar comandos SQL que você pode copiar e colar
 * no Supabase SQL Editor.
 * 
 * Uso: Este arquivo serve como referência. Os arquivos CSS estão em src/skins/
 */

import { getAllSkinCSS } from './getSkinCSS';

export function generateSupabaseSQL() {
  const cssMap = getAllSkinCSS();
  
  const skins = [
    {
      name: 'fire_skin',
      display_name: 'Skin de Fogo',
      description: 'Uma skin com tema de fogo e animações de chama',
      rarity: 'epic',
      unlock_level: 5,
      unlock_condition: 'Completar nível 5',
    },
    {
      name: 'ice_skin',
      display_name: 'Skin de Gelo',
      description: 'Uma skin com tema de gelo e efeitos de brilho',
      rarity: 'rare',
      unlock_level: 3,
      unlock_condition: 'Completar nível 3',
    },
    {
      name: 'neon_skin',
      display_name: 'Skin Neon',
      description: 'Uma skin cyberpunk com efeitos neon',
      rarity: 'epic',
      unlock_victories: 5,
      unlock_condition: 'Ganhar 5 vitórias',
    },
    {
      name: 'rainbow_skin',
      display_name: 'Skin Arco-íris',
      description: 'Uma skin com cores animadas em gradiente',
      rarity: 'legendary',
      unlock_victories: 10,
      unlock_condition: 'Ganhar 10 vitórias',
    },
    {
      name: 'gold_skin',
      display_name: 'Skin Dourada',
      description: 'Uma skin premium com tema dourado',
      rarity: 'legendary',
      unlock_level: 10,
      unlock_condition: 'Completar nível 10',
    },
    {
      name: 'void_skin',
      display_name: 'Skin do Vazio',
      description: 'Uma skin escura com efeitos do vazio',
      rarity: 'epic',
      unlock_victories: 7,
      unlock_condition: 'Ganhar 7 vitórias',
    },
  ];

  const sqlStatements: string[] = [];

  skins.forEach((skin) => {
    const cssKey = skin.name.replace('_skin', '');
    const css = cssMap[cssKey];
    
    if (!css) {
      console.warn(`CSS não encontrado para ${skin.name}`);
      return;
    }

    // Escapar aspas simples no CSS para SQL
    const escapedCSS = css.replace(/'/g, "''");

    const sql = `
-- ${skin.display_name}
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
  '${skin.name}',
  '${skin.display_name}',
  '${skin.description}',
  '${skin.rarity}',
  ${skin.unlock_level ? skin.unlock_level : 'NULL'},
  ${skin.unlock_victories ? skin.unlock_victories : 'NULL'},
  '${skin.unlock_condition}',
  jsonb_build_object(
    'css', $css$${escapedCSS}$css$,
    'type', 'css',
    'theme', '${cssKey}'
  )
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  rarity = EXCLUDED.rarity,
  unlock_level = EXCLUDED.unlock_level,
  unlock_victories = EXCLUDED.unlock_victories,
  unlock_condition = EXCLUDED.unlock_condition,
  sprite_data = EXCLUDED.sprite_data;
`;

    sqlStatements.push(sql);
  });

  return sqlStatements.join('\n');
}

// Para uso em console/Node.js
if (typeof window === 'undefined') {
  console.log(generateSupabaseSQL());
}

