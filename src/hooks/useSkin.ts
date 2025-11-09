import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEquippedSkinWithDetails } from '../utils/skins';
import type { Skin } from '../../supabase/supabase-structure';

interface SkinColors {
  player: string;
  boss: string;
  bossWeakSpot: string;
  bossArm: string;
  playerBullet: string;
  bossBullet: string;
  heart: string;
  background: string;
}

const defaultColors: SkinColors = {
  player: '#00ff00',
  boss: '#ff0000',
  bossWeakSpot: '#ffff00',
  bossArm: '#cc0000',
  playerBullet: '#ffffff',
  bossBullet: '#ff8800',
  heart: '#ff0066',
  background: '#000000',
};

function extractColorsFromCSS(css: string): Partial<SkinColors> {
  const colors: Partial<SkinColors> = {};
  
  const colorMap: Record<string, keyof SkinColors> = {
    '--player-color': 'player',
    '--boss-color': 'boss',
    '--boss-weakspot-color': 'bossWeakSpot',
    '--boss-arm-color': 'bossArm',
    '--player-bullet-color': 'playerBullet',
    '--boss-bullet-color': 'bossBullet',
    '--heart-color': 'heart',
    '--background-color': 'background',
  };

  for (const [cssVar, colorKey] of Object.entries(colorMap)) {
    const regex = new RegExp(`${cssVar}:\\s*([^;]+);`, 'i');
    const match = css.match(regex);
    if (match && match[1]) {
      colors[colorKey] = match[1].trim();
    }
  }

  return colors;
}

function injectSkinCSS(css: string, skinName: string): void {
  const styleId = `skin-${skinName}`;
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = css;
}

function removeSkinCSS(skinName: string): void {
  const styleId = `skin-${skinName}`;
  const styleElement = document.getElementById(styleId);
  if (styleElement) {
    styleElement.remove();
  }
}

export function useSkin() {
  const { user } = useAuth();
  const [colors, setColors] = useState<SkinColors>(defaultColors);
  const [currentSkin, setCurrentSkin] = useState<Skin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setColors(defaultColors);
      setCurrentSkin(null);
      setLoading(false);
      return;
    }

    async function loadSkin() {
      try {
        const equippedSkin = await getEquippedSkinWithDetails(user.id);
        
        if (!equippedSkin || !equippedSkin.skin) {
          setColors(defaultColors);
          setCurrentSkin(null);
          setLoading(false);
          return;
        }

        const skin = equippedSkin.skin;
        setCurrentSkin(skin);

        const css = skin.sprite_data?.css as string | undefined;
        if (css) {
          injectSkinCSS(css, skin.name);
          const extractedColors = extractColorsFromCSS(css);
          setColors({ ...defaultColors, ...extractedColors });
        } else {
          removeSkinCSS(skin.name);
          setColors(defaultColors);
        }
      } catch (error) {
        console.error('Error loading skin:', error);
        setColors(defaultColors);
        setCurrentSkin(null);
      } finally {
        setLoading(false);
      }
    }

    loadSkin();
  }, [user]);

  return { colors, currentSkin, loading };
}

