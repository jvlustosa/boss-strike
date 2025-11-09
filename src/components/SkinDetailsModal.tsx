import { PIXEL_FONT } from '../utils/fonts';
import { getSkinPreviewStyle } from '../utils/skinPreview';
import type { Skin } from '../utils/supabase-structure';

interface SkinDetailsModalProps {
  skin: Skin | null;
  isUnlocked: boolean;
  onClose: () => void;
}

function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'rare': return '#3b82f6';
    case 'epic': return '#a855f7';
    case 'legendary': return '#f59e0b';
    case 'mythic': return '#ef4444';
    default: return '#9ca3af';
  }
}

export function SkinDetailsModal({ skin, isUnlocked, onClose }: SkinDetailsModalProps) {
  if (!skin) return null;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const rarityColor = getRarityColor(skin.rarity);
  const isMystery = skin.is_mystery && !isUnlocked;
  
  const textureName = skin.sprite_data?.texture_name as string | undefined;
  const effectName = skin.sprite_data?.effect as string | undefined;
  const previewStyle = getSkinPreviewStyle(textureName || null, effectName || null);

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10001,
    fontFamily: PIXEL_FONT,
    padding: isMobile ? '20px' : '0',
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: '#111',
    border: `4px solid ${rarityColor}`,
    padding: isMobile ? '20px' : '32px',
    minWidth: isMobile ? '280px' : '400px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: `0 0 0 4px #333, 8px 8px 0px #333, 0 0 30px ${rarityColor}`,
    color: '#fff',
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '20px' : '28px',
    fontWeight: '700',
    marginBottom: '16px',
    textAlign: 'center',
    color: rarityColor,
    textShadow: `0 0 10px ${rarityColor}`,
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: '2px solid #fff',
    color: '#fff',
    fontSize: '20px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontFamily: PIXEL_FONT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  };

  const previewContainerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: isMobile ? '320px' : '400px',
    aspectRatio: '1',
    backgroundColor: '#000',
    borderRadius: '8px',
    marginBottom: '20px',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15%',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    border: `2px solid ${rarityColor}`,
    boxShadow: `0 0 20px ${rarityColor}`,
  };

  const infoRowStyle: React.CSSProperties = {
    marginBottom: '12px',
    padding: '12px',
    backgroundColor: '#222',
    border: `1px solid ${rarityColor}40`,
    borderRadius: '4px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: isMobile ? '11px' : '12px',
    color: '#aaa',
    marginBottom: '4px',
    textTransform: 'uppercase',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: isMobile ? '14px' : '16px',
    color: '#fff',
    fontWeight: '600',
  };

  const getUnlockConditionText = (): string => {
    if (isMystery) return '???';
    if (skin.unlock_condition) return skin.unlock_condition;
    if (skin.unlock_level) return `Completar nível ${skin.unlock_level}`;
    if (skin.unlock_victories) return `Alcançar ${skin.unlock_victories} vitória${skin.unlock_victories > 1 ? 's' : ''}`;
    if (skin.is_default) return 'Disponível desde o início';
    return 'Desbloqueio desconhecido';
  };

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ✕
        </button>

        <div style={titleStyle}>
          {isMystery ? '???' : skin.display_name}
        </div>

        <div 
          className={
            !isMystery && (skin.rarity === 'mythic' || skin.rarity === 'legendary')
              ? 'holo-effect holo-legendary' 
              : !isMystery && skin.rarity === 'epic' 
              ? 'holo-effect holo-epic' 
              : ''
          }
          style={previewContainerStyle}
        >
          {isMystery ? (
            <div 
              style={{
                width: '70%',
                aspectRatio: '1',
                backgroundColor: '#1a1a1a',
                borderRadius: '4px',
                border: `3px solid ${rarityColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '80px' : '120px',
                color: rarityColor,
                fontWeight: 'bold',
                boxShadow: `0 0 30px ${rarityColor}, 0 0 60px ${rarityColor}`,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            >
              ?
            </div>
          ) : (
            <div 
              style={{
                width: '70%',
                aspectRatio: '1',
                backgroundColor: previewStyle.backgroundColor,
                background: previewStyle.backgroundGradient || previewStyle.backgroundColor,
                borderRadius: '4px',
                border: `2px solid ${previewStyle.borderColor}`,
                boxShadow: previewStyle.boxShadow !== 'none' 
                  ? previewStyle.boxShadow 
                  : (skin.rarity === 'mythic'
                    ? `0 0 25px ${rarityColor}, 0 0 50px ${rarityColor}, 0 0 75px ${rarityColor}`
                    : skin.rarity === 'legendary'
                    ? `0 0 20px ${rarityColor}, 0 0 40px ${rarityColor}`
                    : skin.rarity === 'epic'
                    ? `0 0 15px ${rarityColor}, 0 0 30px ${rarityColor}`
                    : skin.rarity === 'rare'
                    ? `0 0 10px ${rarityColor}, 0 0 20px ${rarityColor}`
                    : 'none'),
                animation: previewStyle.animation,
                backgroundSize: previewStyle.backgroundGradient?.includes('rainbow') || previewStyle.backgroundGradient?.includes('mythic') ? '300% 100%' : 'auto',
              }}
              className={skin.rarity === 'mythic' || skin.rarity === 'legendary' || skin.rarity === 'epic' ? 'skin-glow' : ''}
            />
          )}
        </div>

        <div style={infoRowStyle}>
          <div style={labelStyle}>Raridade</div>
          <div style={{ ...valueStyle, color: rarityColor }}>
            {skin.rarity.toUpperCase()}
          </div>
        </div>

        {skin.description && !isMystery && (
          <div style={infoRowStyle}>
            <div style={labelStyle}>Descrição</div>
            <div style={valueStyle}>{skin.description}</div>
          </div>
        )}

        <div style={infoRowStyle}>
          <div style={labelStyle}>Condição de Desbloqueio</div>
          <div style={{ ...valueStyle, color: isUnlocked ? '#4ade80' : '#fbbf24' }}>
            {getUnlockConditionText()}
          </div>
        </div>

        {!isUnlocked && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#2e2a1a',
            border: '2px solid #fbbf24',
            borderRadius: '4px',
            fontSize: isMobile ? '12px' : '14px',
            color: '#fbbf24',
            textAlign: 'center',
          }}>
            🔒 Esta skin ainda não foi desbloqueada
          </div>
        )}

        {isUnlocked && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#1a2e1a',
            border: '2px solid #4ade80',
            borderRadius: '4px',
            fontSize: isMobile ? '12px' : '14px',
            color: '#4ade80',
            textAlign: 'center',
          }}>
            ✓ Skin desbloqueada
          </div>
        )}
      </div>
    </div>
  );
}

