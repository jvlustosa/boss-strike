import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, GameProgress, Skin, UserSkinWithDetails } from '../../supabase/supabase-structure';
import { getVictoryCount, getNextLevel } from '../game/core/progressCache';
import { parseSupabaseError } from '../utils/supabaseErrors';
import { getAllSkins, getUserSkinsWithDetails, equipSkin } from '../utils/skins';

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

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadSkinsData();
    }
  }, [user, authProfile]);

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
      const success = await equipSkin(user.id, skinId);
      if (success) {
        await loadSkinsData();
        await refreshProfile();
        if (showSuccess) {
          showSuccess('Skin equipada com sucesso!');
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
    fontFamily: "'Pixelify Sans', monospace",
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
    fontFamily: "'Pixelify Sans', monospace",
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
    fontFamily: "'Pixelify Sans', monospace",
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
    fontFamily: "'Pixelify Sans', monospace",
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
      default: return '#fff';
    }
  };

  const getSkinPreviewColors = (skinName: string, rarity: string) => {
    const name = skinName.toLowerCase();
    if (name.includes('fire') || name.includes('fogo')) {
      return { primary: '#ff4400', secondary: '#ff8800', bg: '#1a0000' };
    }
    if (name.includes('ice') || name.includes('gelo')) {
      return { primary: '#00ccff', secondary: '#66ddff', bg: '#000033' };
    }
    if (name.includes('neon')) {
      return { primary: '#00ff41', secondary: '#39ff14', bg: '#0a0a0a' };
    }
    if (name.includes('rainbow') || name.includes('arco')) {
      return { primary: '#ff0000', secondary: '#00ff00', bg: '#000000' };
    }
    if (name.includes('gold') || name.includes('dourado')) {
      return { primary: '#ffd700', secondary: '#ffed4e', bg: '#1a1a00' };
    }
    if (name.includes('void') || name.includes('vazio')) {
      return { primary: '#6600ff', secondary: '#9900ff', bg: '#000000' };
    }
    return { primary: getRarityColor(rarity), secondary: '#666', bg: '#111' };
  };

  const renderSkinsTab = () => {
    if (skinsLoading) {
      return <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>Carregando skins...</div>;
    }

    const unlockedSkinIds = new Set(userSkins.map(us => us.skin_id));
    const equippedSkinId = userSkins.find(us => us.is_equipped)?.skin_id;

    const rarityOrder: Record<string, number> = {
      common: 0,
      rare: 1,
      epic: 2,
      legendary: 3,
    };

    const sortedSkins = [...allSkins].sort((a, b) => {
      return rarityOrder[a.rarity] - rarityOrder[b.rarity];
    });

    return (
      <div>
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
            const isUnlocked = unlockedSkinIds.has(skin.id);
            const isEquipped = equippedSkinId === skin.id;
            const colors = getSkinPreviewColors(skin.name, skin.rarity);
            const rarityColor = getRarityColor(skin.rarity);

            return (
              <div
                key={skin.id}
                style={{
                  backgroundColor: isEquipped ? '#1a2e1a' : '#222',
                  border: isEquipped 
                    ? '3px solid #4ade80' 
                    : `2px solid ${rarityColor}`,
                  borderRadius: '8px',
                  padding: isMobile ? '10px' : '12px',
                  opacity: isUnlocked ? 1 : 0.6,
                  position: 'relative',
                  cursor: isUnlocked ? 'pointer' : 'default',
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
                    skin.rarity === 'legendary' 
                      ? 'holo-effect holo-legendary' 
                      : skin.rarity === 'epic' 
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
                  <div 
                    style={{
                      width: '60%',
                      aspectRatio: '1',
                      backgroundColor: colors.primary,
                      borderRadius: '4px',
                      border: `2px solid ${colors.secondary}`,
                      flexShrink: 0,
                      position: 'relative',
                      zIndex: 3,
                      boxShadow: skin.rarity === 'legendary'
                        ? `0 0 20px ${rarityColor}, 0 0 40px ${rarityColor}`
                        : skin.rarity === 'epic'
                        ? `0 0 15px ${rarityColor}, 0 0 30px ${rarityColor}`
                        : skin.rarity === 'rare'
                        ? `0 0 10px ${rarityColor}, 0 0 20px ${rarityColor}`
                        : 'none',
                    }}
                    className={skin.rarity === 'legendary' || skin.rarity === 'epic' ? 'skin-glow' : ''}
                  />
                </div>

                <div style={{
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: '600',
                  color: rarityColor,
                  marginBottom: '4px',
                  textAlign: 'center',
                }}>
                  {skin.display_name}
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
                  {!isUnlocked && (
                    <div style={{
                      fontSize: isMobile ? '10px' : '11px',
                      color: '#666',
                    }}>
                      🔒
                    </div>
                  )}
                </div>

                {isUnlocked && (
                  <button
                    style={{
                      width: '100%',
                      padding: isMobile ? '8px' : '10px',
                      fontSize: isMobile ? '11px' : '12px',
                      backgroundColor: isEquipped ? '#1a2e1a' : '#333',
                      border: isEquipped ? '2px solid #4ade80' : '2px solid #666',
                      color: '#fff',
                      fontFamily: "'Pixelify Sans', monospace",
                      fontWeight: '600',
                      cursor: isEquipped ? 'default' : 'pointer',
                      opacity: equippingSkin === skin.id ? 0.6 : 1,
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}
                    onClick={() => !isEquipped && handleEquipSkin(skin.id)}
                    disabled={isEquipped || equippingSkin === skin.id}
                  >
                    {equippingSkin === skin.id 
                      ? 'Equipando...' 
                      : isEquipped 
                        ? 'Equipada' 
                        : 'Equipar'}
                  </button>
                )}

                {!isUnlocked && (
                  <div style={{
                    padding: isMobile ? '6px' : '8px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    fontSize: isMobile ? '10px' : '11px',
                    color: '#666',
                    textAlign: 'center',
                    borderRadius: '4px',
                  }}>
                    {skin.unlock_condition || 'Bloqueada'}
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

