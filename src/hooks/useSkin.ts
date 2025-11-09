import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSelectedSkinWithDetails } from '../utils/skins';
import { setColors as setGameColors, setSkinData } from '../game/core/assets';
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

function extractPlayerColorFromClass(className: string): string | null {
  // Get computed styles from a temporary element with the skin class
  const tempEl = document.createElement('div');
  tempEl.className = className;
  document.body.appendChild(tempEl);
  
  const computed = getComputedStyle(tempEl);
  const playerColor = computed.getPropertyValue('--player-color').trim();
  
  document.body.removeChild(tempEl);
  return playerColor || null;
}

function applySkinClass(className: string | null, effectName?: string): void {
  // Remove all skin classes and effect classes from body
  const bodyClasses = Array.from(document.body.classList);
  bodyClasses.forEach(cls => {
    if (cls.startsWith('skin-') || cls.startsWith('effect-')) {
      document.body.classList.remove(cls);
    }
  });
  
  // Add new skin class if provided
  if (className) {
    document.body.classList.add(className);
  }
  
  // Add effect class if provided
  if (effectName) {
    document.body.classList.add(`effect-${effectName}`);
  }
}

export function useSkin() {
  const { user, profile } = useAuth();
  const [colors, setColors] = useState<SkinColors>(defaultColors);
  const [currentSkin, setCurrentSkin] = useState<Skin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setColors(defaultColors);
      setGameColors({});
      setSkinData({
        textureName: null,
        effectName: null,
        playerColor: null,
        playerGlow: null,
        rarity: null,
        cssVariables: {},
      });
      setCurrentSkin(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSkin() {
      try {
        const selectedSkin = await getSelectedSkinWithDetails(user.id);
        
        if (cancelled) return;
        
        if (!selectedSkin || !selectedSkin.skin) {
          setColors(defaultColors);
          setGameColors({});
          setSkinData({
            textureName: null,
            effectName: null,
            playerColor: null,
            playerGlow: null,
            cssVariables: {},
          });
          setCurrentSkin(null);
          setLoading(false);
          return;
        }

        const skin = selectedSkin.skin;
        setCurrentSkin(skin);

        const textureName = skin.sprite_data?.texture_name as string | undefined;
        const effectName = skin.sprite_data?.effect as string | undefined;
        
        if (textureName) {
          const className = `skin-${textureName}`;
          applySkinClass(className, effectName);
          
          // Extract CSS variables after class is applied
          requestAnimationFrame(() => {
            if (cancelled) return;
            
            const tempDiv = document.createElement('div');
            tempDiv.className = className;
            document.body.appendChild(tempDiv);
            
            const computedStyle = getComputedStyle(tempDiv);
            const playerColor = computedStyle.getPropertyValue('--player-color').trim();
            const playerGlow = computedStyle.getPropertyValue('--player-glow').trim();
            
            // Extract all CSS variables
            const cssVariables: Record<string, string> = {};
            
            // Get all CSS variables from computed style
            for (let i = 0; i < computedStyle.length; i++) {
              const prop = computedStyle[i];
              if (prop.startsWith('--')) {
                cssVariables[prop] = computedStyle.getPropertyValue(prop).trim();
              }
            }
            
            document.body.removeChild(tempDiv);
            
            if (cancelled) return;
            
            // Sempre armazenar dados da skin, mesmo se playerColor estiver vazio
            // (pode ser que a skin use apenas gradientes)
            if (textureName) {
              // Only update player color, keep everything else default
              if (playerColor) {
                const newColors = { ...defaultColors, player: playerColor };
                setColors(newColors);
                setGameColors({ player: playerColor });
              }
              
              // Store complete skin data for PlayerRenderer
              setSkinData({
                textureName,
                effectName: effectName || null,
                playerColor: playerColor || defaultColors.player,
                playerGlow: playerGlow || playerColor || defaultColors.player,
                rarity: skin.rarity || null,
                cssVariables,
              });
              
              console.log('Skin applied (complete):', {
                name: skin.name,
                className,
                effectName: effectName || 'no effect',
                textureName,
                playerColor: playerColor || 'using default',
                playerGlow: playerGlow || 'using default',
                cssVariablesCount: Object.keys(cssVariables).length,
              });
            } else {
              setColors(defaultColors);
              setGameColors({});
              setSkinData({
                textureName: null,
                effectName: null,
                playerColor: null,
                playerGlow: null,
                cssVariables: {},
              });
              console.log('No player color found in skin, using defaults');
            }
            
            setLoading(false);
          });
        } else {
          if (cancelled) return;
          applySkinClass(null);
          setColors(defaultColors);
          setGameColors({});
          setSkinData({
            textureName: null,
            effectName: null,
            playerColor: null,
            playerGlow: null,
            cssVariables: {},
          });
          setLoading(false);
          console.log('Skin removed, using defaults');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading skin:', error);
        setColors(defaultColors);
        setGameColors({});
        setSkinData({
          textureName: null,
          effectName: null,
          playerColor: null,
          playerGlow: null,
          cssVariables: {},
        });
        setCurrentSkin(null);
        setLoading(false);
      }
    }

    loadSkin();
    
    return () => {
      cancelled = true;
    };
  }, [user, profile?.selected_skin]);

  return { colors, currentSkin, loading };
}

