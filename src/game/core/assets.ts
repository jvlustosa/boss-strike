// Placeholder para sprites - usando formas geométricas por enquanto
export const defaultColors = {
  player: '#00ff00',
  boss: '#ff0000',
  bossWeakSpot: '#ffff00',
  bossArm: '#cc0000',
  playerBullet: '#ffffff',
  bossBullet: '#ff8800',
  heart: '#ff0066',
  background: '#000000',
} as const;

let currentColors = { ...defaultColors };

export interface SkinData {
  textureName: string | null;
  effectName: string | null;
  playerColor: string | null;
  playerGlow: string | null;
  cssVariables: Record<string, string>;
}

let currentSkinData: SkinData = {
  textureName: null,
  effectName: null,
  playerColor: null,
  playerGlow: null,
  cssVariables: {},
};

export function getColors() {
  return currentColors;
}

export function setColors(newColors: Partial<typeof defaultColors>) {
  currentColors = { ...defaultColors, ...newColors };
}

export function getSkinData(): SkinData {
  return { ...currentSkinData };
}

export function setSkinData(skinData: Partial<SkinData>) {
  currentSkinData = { ...currentSkinData, ...skinData };
}

// Export colors as getter for backward compatibility
export const colors = new Proxy({} as typeof defaultColors, {
  get: (_, prop) => currentColors[prop as keyof typeof defaultColors],
});
