import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, GameProgress, Skin, UserSkinWithDetails } from '../../supabase/supabase-structure';
import { getVictoryCount, getNextLevel } from '../game/core/progressCache';
import { parseSupabaseError } from '../utils/supabaseErrors';
import { getAllSkins, getUserSkinsWithDetails, equipSkin } from '../utils/skins';
import { PIXEL_FONT } from '../utils/fonts';
import { getSkinPreviewStyle } from '../utils/skinPreview';
import { SkinDetailsModal } from './SkinDetailsModal';

interface ProfilePageProps {
  onClose: () => void;
  showToast?: (message: string, errorCode?: string, duration?: number) => string;
  showSuccess?: (message: string, duration?: number) => string;
}

type Tab = 'profile' | 'skins';

export function ProfilePage({ onClose, showToast, showSuccess }: ProfilePageProps) {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [victoryCount, setVictoryCount] = useState(0);
  const [nextLevel, setNextLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Skins state
  const [allSkins, setAllSkins] = useState<Skin[]>([]);
  const [userSkins, setUserSkins] = useState<UserSkinWithDetails[]>([]);
  const [skinsLoading, setSkinsLoading] = useState(false);
  const [equippingSkin, setEquippingSkin] = useState<string | null>(null);
  const [selectedSkinForModal, setSelectedSkinForModal] = useState<Skin | null>(null);
  
  // Cheat mode: check for ?cheat=skins in URL
  const isCheatMode = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('cheat') === 'skins';
  };

  useEffect(() => {
    // Add pulse animation for mystery skins
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
    `;
    style.setAttribute('data-pulse-animation', 'true');
    if (!document.head.querySelector('style[data-pulse-animation]')) {
      document.head.appendChild(style);
    }
    
    return () => {
      const existing = document.head.querySelector('style[data-pulse-animation]');
      if (existing) {
        document.head.removeChild(existing);
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadSkinsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  // Separar useEffect para atualizar quando selected_skin mudar
  useEffect(() => {
    if (user && authProfile?.selected_skin !== profile?.selected_skin) {
      loadProfileData();
      loadSkinsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authProfile?.selected_skin]);

  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      if (authProfile && authProfile.id === user.id) {
        setProfile(authProfile);
      } else {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profileData) setProfile(profileData as Profile);
      }

      const [progressData, victories, level] = await Promise.all([
        supabase.from('game_progress').select('*').eq('user_id', user.id).single(),
        getVictoryCount(),
        getNextLevel(),
      ]);

      if (progressData.data) setProgress(progressData.data as GameProgress);
      setVictoryCount(victories);
      setNextLevel(level);
    } catch (error) {
      console.error('Error loading profile:', error);
      const errorInfo = parseSupabaseError(error);
      if (showToast) {
        showToast(`Erro ao carregar perfil: ${errorInfo.message}`, errorInfo.code);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSkinsData = async () => {
    if (!user) return;
    
    setSkinsLoading(true);
    try {
      const [allSkinsData, userSkinsData] = await Promise.all([
        getAllSkins(),
        getUserSkinsWithDetails(user.id),
      ]);

      setAllSkins(allSkinsData);
      setUserSkins(userSkinsData);
    } catch (error) {
      console.error('Error loading skins:', error);
      const errorInfo = parseSupabaseError(error);
      if (showToast) {
        showToast(`Erro ao carregar skins: ${errorInfo.message}`, errorInfo.code);
      }
    } finally {
      setSkinsLoading(false);
    }
  };

  const handleEquipSkin = async (skinId: string) => {
    if (!user) return;
    
    setEquippingSkin(skinId);
    try {
      const cheatMode = isCheatMode();
      
      // In cheat mode, create the skin if it doesn't exist
      if (cheatMode) {
        const hasSkin = userSkins.some(us => us.skin_id === skinId);
        if (!hasSkin) {
          // Unlock the skin first
          const { data: newUserSkin, error: unlockError } = await supabase
            .from('user_skins')
            .insert({
              user_id: user.id,
              skin_id: skinId,
            })
            .select()
            .single();
          
          if (unlockError && unlockError.code !== '23505') { // Ignore duplicate key error
            console.error('Error unlocking skin in cheat mode:', unlockError);
            throw new Error('Falha ao desbloquear skin');
          }
          
          // If we just created it, use the newUserSkin directly
          if (newUserSkin) {
            // Update profile with selected_skin directly
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ selected_skin: newUserSkin.id })
              .eq('id', user.id);
            
            if (updateError) {
              console.error('Error equipping newly created skin:', updateError);
              throw new Error('Falha ao equipar skin');
            }
            
            // Atualizar apenas o necessário, sem recarregar tudo
            await refreshProfile();
            // Recarregar apenas skins após um pequeno delay para evitar loop
            setTimeout(() => {
              loadSkinsData();
            }, 100);
            
            if (showSuccess) {
              showSuccess('Skin criada e equipada com sucesso! (CHEAT MODE)');
            }
            setEquippingSkin(null);
            return;
          }
        }
      }
      
      const success = await equipSkin(user.id, skinId);
      if (success) {
        // Atualizar profile primeiro
        await refreshProfile();
        // Recarregar skins após um pequeno delay para evitar loop
        setTimeout(() => {
          loadSkinsData();
        }, 100);
        
        if (showSuccess) {
          showSuccess(cheatMode ? 'Skin criada e equipada com sucesso! (CHEAT MODE)' : 'Skin equipada com sucesso!');
        }
      } else {
        throw new Error('Falha ao equipar skin');
      }
    } catch (error) {
      const errorInfo = parseSupabaseError(error);
      if (showToast) {
        showToast(`Erro ao equipar skin: ${errorInfo.message}`, errorInfo.code);
      }
    } finally {
      setEquippingSkin(null);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      const errorInfo = parseSupabaseError(error);
      if (showToast) {
        showToast(`Erro ao fazer logout: ${errorInfo.message}`, errorInfo.code);
      }
    }
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLandscape = isMobile && window.innerHeight < window.innerWidth;

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
    zIndex: 10000,
    fontFamily: PIXEL_FONT,
    overflow: 'auto',
    padding: isMobile ? '10px' : '20px',
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: '#111',
    border: '4px solid #fff',
    padding: isMobile ? '20px' : '32px',
    minWidth: isMobile ? '90%' : '600px',
    maxWidth: isMobile ? '100%' : '800px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 0 0 4px #333, 8px 8px 0px #333',
    color: '#fff',
    margin: 'auto',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '24px' : '32px',
    fontWeight: '700',
    marginBottom: '24px',
    textAlign: 'center',
    textShadow: '2px 2px 0px #333',
    color: '#fff',
  };

  const tabContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '3px solid #666',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: isMobile ? '10px 16px' : '12px 24px',
    backgroundColor: active ? '#222' : 'transparent',
    border: active ? '3px solid #fff' : '3px solid transparent',
    borderBottom: active ? '3px solid #fff' : '3px solid transparent',
    color: active ? '#fff' : '#666',
    fontFamily: PIXEL_FONT,
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: '600',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    marginBottom: '-3px',
    transition: 'none',
  });

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    fontSize: isMobile ? '14px' : '16px',
    padding: '12px',
    backgroundColor: '#222',
    border: '2px solid #666',
  };

  const labelStyle: React.CSSProperties = {
    color: '#aaa',
    fontWeight: '400',
  };

  const valueStyle: React.CSSProperties = {
    color: '#fff',
    fontWeight: '600',
  };

  const buttonStyle = (hovered: boolean): React.CSSProperties => ({
    width: '100%',
    padding: isMobile ? '14px' : '16px',
    marginTop: '20px',
    backgroundColor: hovered ? '#333' : '#222',
    border: '3px solid #fff',
    color: '#fff',
    fontFamily: PIXEL_FONT,
    fontSize: isMobile ? '16px' : '18px',
    fontWeight: '600',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    boxShadow: hovered ? 'inset 0 0 0 2px #fff, 4px 4px 0px #333' : '4px 4px 0px #333',
    transition: 'none',
  });

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer',
    fontFamily: PIXEL_FONT,
    padding: '8px',
    lineHeight: '1',
  };

  const [logoutHovered, setLogoutHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);

  // Skins rendering
  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return '#aaa';
      case 'rare': return '#60a5fa';
      case 'epic': return '#a78bfa';
      case 'legendary': return '#fbbf24';
      case 'mythic': return '#ff00ff';
      default: return '#fff';
    }
  };

  // Função removida - agora usa getSkinPreviewStyle que extrai do CSS

  const renderSkinsTab = () => {
    if (skinsLoading) {
      return <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>Carregando skins...</div>;
    }

    const cheatMode = isCheatMode();
    const unlockedSkinIds = new Set(userSkins.map(us => us.skin_id));
    const selectedSkinId = profile?.selected_skin 
      ? userSkins.find(us => us.id === profile.selected_skin)?.skin_id 
      : null;

    const rarityOrder: Record<string, number> = {
      common: 0,
      rare: 1,
      epic: 2,
      legendary: 3,
      mythic: 4,
    };

    const sortedSkins = [...allSkins].sort((a, b) => {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    return (
      <div>
        {cheatMode && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#ff00ff22', 
            border: '2px solid #ff00ff',
            borderRadius: '8px',
            fontSize: isMobile ? '12px' : '14px', 
            color: '#ff00ff',
            textAlign: 'center',
            fontWeight: 'bold'
          }}>
            🎮 CHEAT MODE ATIVO - Todas as skins disponíveis!
          </div>
        )}
        <div style={{ marginBottom: '20px', fontSize: isMobile ? '14px' : '16px', color: '#aaa' }}>
          Você possui {userSkins.length} de {allSkins.length} skins
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '12px' : '16px',
          maxHeight: '500px',
          overflowY: 'auto',
          padding: '4px',
        }}>
          {sortedSkins.map((skin) => {
            // In cheat mode, all skins are considered unlocked
            const isUnlocked = cheatMode || unlockedSkinIds.has(skin.id);
            const isEquipped = selectedSkinId === skin.id;
            const rarityColor = getRarityColor(skin.rarity);
            const isMystery = skin.is_mystery && !isUnlocked;
            
            // Obter estilos da skin do CSS (mesma lógica do PlayerRenderer)
            const textureName = skin.sprite_data?.texture_name as string | undefined;
            const effectName = skin.sprite_data?.effect as string | undefined;
            const previewStyle = getSkinPreviewStyle(textureName || null, effectName || null);

            return (
              <div
                key={skin.id}
                onClick={() => setSelectedSkinForModal(skin)}
                style={{
                  backgroundColor: isEquipped ? '#1a2e1a' : '#222',
                  border: isEquipped 
                    ? '3px solid #4ade80' 
                    : `2px solid ${rarityColor}`,
                  borderRadius: '8px',
                  padding: isMobile ? '10px' : '12px',
                  opacity: isUnlocked ? 1 : 0.6,
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
              >
                {isEquipped && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: '#4ade80',
                    color: '#000',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 1,
                  }}>
                    ✓
                  </div>
                )}

                <div 
                  className={
                    !isMystery && (skin.rarity === 'mythic' || skin.rarity === 'legendary')
                      ? 'holo-effect holo-legendary' 
                      : !isMystery && skin.rarity === 'epic' 
                      ? 'holo-effect holo-epic' 
                      : ''
                  }
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: '#000000',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20%',
                    boxSizing: 'border-box',
                    minHeight: 0,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {isMystery ? (
                    <div 
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      }}
                      style={{
                        width: '60%',
                        aspectRatio: '1',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '4px',
                        border: `3px solid ${rarityColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '48px' : '64px',
                        color: rarityColor,
                        fontWeight: 'bold',
                        boxShadow: `0 0 20px ${rarityColor}, 0 0 40px ${rarityColor}`,
                        animation: 'pulse 2s ease-in-out infinite',
                        transition: 'transform 0.3s ease',
                        transform: 'scale(1) rotate(0deg)',
                      }}
                    >
                      ?
                    </div>
                  ) : (
                    <div 
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      }}
                      style={{
                        width: '60%',
                        aspectRatio: '1',
                        backgroundColor: previewStyle.backgroundColor,
                        background: previewStyle.backgroundGradient || previewStyle.backgroundColor,
                        borderRadius: '4px',
                        border: `2px solid ${previewStyle.borderColor}`,
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 3,
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
                        transition: 'transform 0.3s ease',
                        transform: 'scale(1) rotate(0deg)',
                      }}
                      className={skin.rarity === 'mythic' || skin.rarity === 'legendary' || skin.rarity === 'epic' ? 'skin-glow' : ''}
                    />
                  )}
                </div>

                <div style={{ 
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: '600',
                  color: rarityColor,
                  marginBottom: '4px',
                  textAlign: 'center',
                }}>
                  {isMystery ? '???' : skin.display_name}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                  width: '100%',
                }}>
                  <div style={{
                    padding: '2px 6px',
                    backgroundColor: '#333',
                    border: `1px solid ${rarityColor}`,
                    fontSize: isMobile ? '9px' : '10px',
                    textTransform: 'uppercase',
                    color: rarityColor,
                    borderRadius: '4px',
                  }}>
                    {skin.rarity}
                  </div>
                  {!isUnlocked && !cheatMode && (
                    <div style={{
                      fontSize: isMobile ? '10px' : '11px',
                      color: '#666',
                    }}>
                      🔒
                    </div>
                  )}
                  {!isUnlocked && cheatMode && (
                    <div style={{
                      fontSize: isMobile ? '10px' : '11px',
                      color: '#ff00ff',
                    }}>
                      ✨
                    </div>
                  )}
                </div>
                
                {(isUnlocked || cheatMode) && (
                  <button
                    style={{
                      width: '100%',
                      padding: isMobile ? '8px' : '10px',
                      fontSize: isMobile ? '11px' : '12px',
                      backgroundColor: isEquipped ? '#1a2e1a' : cheatMode && !isUnlocked ? '#ff00ff22' : '#333',
                      border: isEquipped ? '2px solid #4ade80' : cheatMode && !isUnlocked ? '2px solid #ff00ff' : '2px solid #666',
                      color: cheatMode && !isUnlocked ? '#ff00ff' : '#fff',
                      fontFamily: "'Pixelify Sans', monospace",
                      fontWeight: '600',
                      cursor: isEquipped ? 'default' : 'pointer',
                      opacity: equippingSkin === skin.id ? 0.6 : 1,
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEquipped) handleEquipSkin(skin.id);
                    }}
                    disabled={isEquipped || equippingSkin === skin.id}
                  >
                    {equippingSkin === skin.id 
                      ? 'Equipando...' 
                      : isEquipped 
                        ? 'Equipada' 
                        : cheatMode && !isUnlocked
                        ? 'Criar & Equipar'
                        : 'Equipar'}
                  </button>
                )}
                
                {!isUnlocked && !cheatMode && (
                  <div style={{
                    padding: isMobile ? '6px' : '8px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    fontSize: isMobile ? '10px' : '11px',
                    color: '#666',
                    textAlign: 'center',
                    borderRadius: '4px',
                  }}>
                    {isMystery ? '???' : (skin.unlock_condition || 'Bloqueada')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProfileTab = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>Carregando...</div>;
    }

    return (
      <div>
        <div style={infoRowStyle}>
          <span style={labelStyle}>Usuário:</span>
          <span style={valueStyle}>{profile?.username || 'Sem nome'}</span>
        </div>

        <div style={infoRowStyle}>
          <span style={labelStyle}>Email:</span>
          <span style={valueStyle}>{profile?.email || 'N/A'}</span>
        </div>

        <div style={infoRowStyle}>
          <span style={labelStyle}>Nível Atual:</span>
          <span style={valueStyle}>{progress?.level || 1}</span>
        </div>

        <div style={infoRowStyle}>
          <span style={labelStyle}>Próximo Nível:</span>
          <span style={valueStyle}>{nextLevel}</span>
        </div>

        <div style={infoRowStyle}>
          <span style={labelStyle}>Vitórias:</span>
          <span style={valueStyle}>🏆 {victoryCount}</span>
        </div>

        {progress?.last_played_at && (
          <div style={infoRowStyle}>
            <span style={labelStyle}>Última Jogada:</span>
            <span style={valueStyle}>
              {new Date(progress.last_played_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}

        <button
          style={buttonStyle(logoutHovered)}
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHovered(true)}
          onMouseLeave={() => setLogoutHovered(false)}
        >
          Sair
        </button>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .skin-glow {
          animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
          0% { 
            filter: brightness(1);
          }
          100% { 
            filter: brightness(1.3);
          }
        }
        
        /* Holographic Effect - Inspired by pokemon-cards-css */
        .holo-effect {
          position: relative;
          overflow: hidden;
        }
        
        .holo-effect::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          ),
          linear-gradient(
            -45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          ),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          );
          animation: holo-shine 3s linear infinite;
          pointer-events: none;
          z-index: 2;
          mix-blend-mode: overlay;
        }
        
        .holo-effect::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(198, 119, 255, 0.3), transparent 50%);
          animation: holo-shift 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
          mix-blend-mode: color-dodge;
          opacity: 0.5;
        }
        
        @keyframes holo-shine {
          0% {
            transform: translateX(-100%) translateY(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(100%) translateY(100%) rotate(45deg);
          }
        }
        
        @keyframes holo-shift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          33% {
            transform: translate(10%, -10%) scale(1.1);
            opacity: 0.7;
          }
          66% {
            transform: translate(-10%, 10%) scale(0.9);
            opacity: 0.6;
          }
        }
        
        .holo-rare {
          background: linear-gradient(
            125deg,
            rgba(96, 165, 250, 0.1) 0%,
            rgba(59, 130, 246, 0.2) 25%,
            rgba(37, 99, 235, 0.1) 50%,
            rgba(59, 130, 246, 0.2) 75%,
            rgba(96, 165, 250, 0.1) 100%
          );
          background-size: 200% 200%;
          animation: holo-gradient 3s ease infinite;
        }
        
        .holo-epic {
          background: linear-gradient(
            125deg,
            rgba(167, 139, 250, 0.1) 0%,
            rgba(139, 92, 246, 0.2) 25%,
            rgba(124, 58, 237, 0.1) 50%,
            rgba(139, 92, 246, 0.2) 75%,
            rgba(167, 139, 250, 0.1) 100%
          );
          background-size: 200% 200%;
          animation: holo-gradient 3s ease infinite;
        }
        
        .holo-legendary {
          background: linear-gradient(
            125deg,
            rgba(251, 191, 36, 0.15) 0%,
            rgba(245, 158, 11, 0.25) 25%,
            rgba(217, 119, 6, 0.15) 50%,
            rgba(245, 158, 11, 0.25) 75%,
            rgba(251, 191, 36, 0.15) 100%
          );
          background-size: 200% 200%;
          animation: holo-gradient 2.5s ease infinite;
        }
        
        @keyframes holo-gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <button
          style={closeButtonStyle}
          onClick={onClose}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
        >
          ✕
        </button>

        <h2 style={titleStyle}>Meu Perfil</h2>

        <div style={tabContainerStyle}>
          <button
            style={tabStyle(activeTab === 'profile')}
            onClick={() => setActiveTab('profile')}
          >
            Conta
          </button>
          <button
            style={tabStyle(activeTab === 'skins')}
            onClick={() => setActiveTab('skins')}
          >
            Skins ({userSkins.length}/{allSkins.length})
          </button>
        </div>

        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'skins' && renderSkinsTab()}
      </div>
    </div>
    </>
  );
}

