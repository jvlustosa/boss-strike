/**
 * Utilitário para extrair cores e estilos de skins para preview
 * Garante que o preview use as mesmas cores e estilos do PlayerRenderer
 */

export interface SkinPreviewStyle {
  backgroundColor: string;
  backgroundGradient?: string;
  borderColor: string;
  boxShadow: string;
  animation?: string;
}

/**
 * Extrai cores e estilos de uma skin do CSS
 */
export function getSkinPreviewStyle(
  textureName: string | null,
  effectName: string | null
): SkinPreviewStyle {
  if (!textureName) {
    return {
      backgroundColor: '#00ff00',
      borderColor: '#00ff00',
      boxShadow: 'none',
    };
  }

  // Criar elemento temporário para obter estilos CSS
  const className = `skin-${textureName}`;
  const tempDiv = document.createElement('div');
  tempDiv.className = className;
  document.body.appendChild(tempDiv);

  const computedStyle = getComputedStyle(tempDiv);
  const playerColor = computedStyle.getPropertyValue('--player-color').trim() || '#00ff00';
  const playerGlow = computedStyle.getPropertyValue('--player-glow').trim() || playerColor;

  document.body.removeChild(tempDiv);

  // Normalizar textureName
  const normalizedName = textureName.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Aplicar estilos baseados no tipo de skin (mesma lógica do PlayerRenderer)
  if (normalizedName.includes('fire')) {
    return {
      backgroundColor: playerColor,
      backgroundGradient: `linear-gradient(135deg, ${playerColor}, ${playerGlow})`,
      borderColor: playerGlow,
      boxShadow: `0 0 10px ${playerGlow}, 0 0 20px ${playerGlow}`,
    };
  }

  if (normalizedName.includes('ice')) {
    return {
      backgroundColor: playerColor,
      backgroundGradient: `linear-gradient(135deg, ${playerColor}, ${playerGlow})`,
      borderColor: playerGlow,
      boxShadow: `0 0 15px ${playerGlow}, 0 0 30px rgba(102, 221, 255, 0.3)`,
    };
  }

  if (normalizedName.includes('neon')) {
    return {
      backgroundColor: playerColor,
      borderColor: playerGlow,
      boxShadow: `0 0 10px ${playerGlow}, 0 0 20px ${playerGlow}, 0 0 30px ${playerGlow}`,
    };
  }

  if (normalizedName.includes('rainbow')) {
    return {
      backgroundColor: playerColor,
      backgroundGradient: `linear-gradient(90deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #0000ff 57%, #4b0082 71%, #9400d3 85%, #ff0000 100%)`,
      borderColor: '#ffffff',
      boxShadow: `0 0 20px rgba(255, 255, 255, 0.5)`,
      animation: 'rainbow-flow 2s linear infinite',
    };
  }

  if (normalizedName.includes('gold')) {
    return {
      backgroundColor: '#ffd700',
      backgroundGradient: `linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)`,
      borderColor: '#ffed4e',
      boxShadow: `0 0 15px #ffd700, 0 0 30px rgba(255, 215, 0, 0.6)`,
    };
  }

  if (normalizedName.includes('void')) {
    return {
      backgroundColor: playerColor,
      backgroundGradient: `radial-gradient(circle, ${playerColor}, #330066)`,
      borderColor: playerGlow,
      boxShadow: `0 0 20px ${playerGlow}, 0 0 40px rgba(153, 0, 255, 0.5)`,
    };
  }

  if (normalizedName.includes('basic')) {
    return {
      backgroundColor: playerColor,
      borderColor: playerGlow,
      boxShadow: 'none',
    };
  }

  if (normalizedName.includes('mythic')) {
    return {
      backgroundColor: playerColor,
      backgroundGradient: `linear-gradient(90deg, #ff0000 0%, #ff7f00 8%, #ffff00 16%, #00ff00 24%, #00ffff 32%, #0000ff 40%, #4b0082 48%, #9400d3 56%, #ff1493 64%, #ff0000 72%, #ff7f00 80%, #ffff00 88%, #00ff00 96%, #ff0000 100%)`,
      borderColor: 'rgba(255, 255, 255, 0.5)',
      boxShadow: `0 0 20px rgba(255, 255, 255, 0.6), 0 0 40px rgba(255, 0, 255, 0.4), 0 0 60px rgba(0, 255, 255, 0.3)`,
      animation: 'mythic-rainbow-flow 1.5s linear infinite',
    };
  }

  // Default - gradiente básico
  return {
    backgroundColor: playerColor,
    backgroundGradient: `linear-gradient(135deg, ${playerColor}, ${playerGlow})`,
    borderColor: playerGlow,
    boxShadow: 'none',
  };
}

