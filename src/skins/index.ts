export const skinStyles = {
  fire: () => import('./fire-skin.css?inline'),
  ice: () => import('./ice-skin.css?inline'),
  neon: () => import('./neon-skin.css?inline'),
  rainbow: () => import('./rainbow-skin.css?inline'),
  gold: () => import('./gold-skin.css?inline'),
  void: () => import('./void-skin.css?inline'),
} as const;

export type SkinStyleName = keyof typeof skinStyles;

export function getSkinCSS(skinName: string): string | null {
  const normalizedName = skinName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (normalizedName.includes('fire')) return 'fire';
  if (normalizedName.includes('ice') || normalizedName.includes('gelo')) return 'ice';
  if (normalizedName.includes('neon')) return 'neon';
  if (normalizedName.includes('rainbow') || normalizedName.includes('arco')) return 'rainbow';
  if (normalizedName.includes('gold') || normalizedName.includes('dourado')) return 'gold';
  if (normalizedName.includes('void') || normalizedName.includes('vazio')) return 'void';
  
  return null;
}

