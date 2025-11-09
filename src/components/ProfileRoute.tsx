import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, GameProgress, Skin, UserSkinWithDetails } from '../../supabase/supabase-structure';
import { parseSupabaseError } from '../utils/supabaseErrors';
import { getAllSkins, getUserSkinsWithDetails, equipSkin } from '../utils/skins';
import { getVictoryCount, getNextLevel } from '../game/core/progressCache';
import { PIXEL_FONT } from '../utils/fonts';
import { getSkinPreviewStyle } from '../utils/skinPreview';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from './ToastContainer';
import { SkinDetailsModal } from './SkinDetailsModal';

type Tab = 'profile' | 'skins';

export function ProfileRoute() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [victoryCount, setVictoryCount] = useState(0);
  const [nextLevel, setNextLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [allSkins, setAllSkins] = useState<Skin[]>([]);
  const [userSkins, setUserSkins] = useState<UserSkinWithDetails[]>([]);
  const [skinsLoading, setSkinsLoading] = useState(false);
  const [equippingSkin, setEquippingSkin] = useState<string | null>(null);
  const [selectedSkinForModal, setSelectedSkinForModal] = useState<Skin | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [voltarHovered, setVoltarHovered] = useState(false);
  const [jogarHovered, setJogarHovered] = useState(false);
  const [contaTabHovered, setContaTabHovered] = useState(false);
  const [skinsTabHovered, setSkinsTabHovered] = useState(false);
  const toast = useToast();

  const isCheatMode = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('cheat') === 'skins';
  };

  useEffect(() => {
    loadProfileData();
  }, [username]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails('');
      
      let profileData: Profile | null = null;
      if (authProfile && authProfile.username === username) {
        profileData = authProfile;
        setProfile(authProfile);
      } else {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
        
        if (fetchError) {
          throw new Error(`Failed to fetch profile: ${fetchError.message}`);
        }
        
        if (data) {
          profileData = data as Profile;
          setProfile(profileData);
        } else {
          throw new Error(`Profile not found: ${username}`);
        }
      }

      if (profileData) {
        const [progressData, victories, level] = await Promise.all([
          supabase.from('game_progress').select('*').eq('user_id', profileData.id).single(),
          getVictoryCount(),
          getNextLevel(),
        ]);

        if (progressData.error) {
          console.warn('Error loading progress:', progressData.error);
        }
        
        if (progressData.data) setProgress(progressData.data as GameProgress);
        setVictoryCount(victories);
        setNextLevel(level);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error('Error loading profile:', errorObj);
      setError(errorObj);
      setErrorDetails(JSON.stringify({
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name,
        username,
        timestamp: new Date().toISOString(),
      }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const loadSkinsData = async () => {
    if (!profile) return;
    
    setSkinsLoading(true);
    try {
      setError(null);
      const [allSkinsData, userSkinsData] = await Promise.all([
        getAllSkins(),
        getUserSkinsWithDetails(profile.id),
      ]);

      setAllSkins(allSkinsData);
      setUserSkins(userSkinsData);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error('Error loading skins:', errorObj);
      setError(errorObj);
      setErrorDetails(JSON.stringify({
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name,
        profileId: profile.id,
        timestamp: new Date().toISOString(),
      }, null, 2));
    } finally {
      setSkinsLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadSkinsData();
    }
  }, [profile]);

  useEffect(() => {
    // Enable scrolling for profile page
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyPosition = document.body.style.position;
    const htmlPosition = document.documentElement.style.position;
    
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.body.style.position = 'relative';
    document.documentElement.style.position = 'relative';
    
    return () => {
      // Restore original styles when component unmounts
      // Use setTimeout to ensure this happens after navigation
      setTimeout(() => {
        if (bodyOverflow) {
          document.body.style.overflow = bodyOverflow;
        } else {
          document.body.style.overflow = 'hidden';
        }
        
        if (htmlOverflow) {
          document.documentElement.style.overflow = htmlOverflow;
        } else {
          document.documentElement.style.overflow = 'hidden';
        }
        
        if (bodyPosition) {
          document.body.style.position = bodyPosition;
        } else {
          document.body.style.position = 'fixed';
        }
        
        if (htmlPosition) {
          document.documentElement.style.position = htmlPosition;
        } else {
          document.documentElement.style.position = 'fixed';
        }
      }, 0);
    };
  }, []);

  const handleEquipSkin = async (skinId: string) => {
    if (!user || !profile) return;
    
    if (user.id !== profile.id) {
      return;
    }
    
    setEquippingSkin(skinId);
    try {
      const cheatMode = isCheatMode();
      
      if (cheatMode) {
        const hasSkin = userSkins.some(us => us.skin_id === skinId);
        if (!hasSkin) {
          const { data: newUserSkin, error: unlockError } = await supabase
            .from('user_skins')
            .insert({
              user_id: user.id,
              skin_id: skinId,
            })
            .select()
            .single();
          
          if (unlockError && unlockError.code !== '23505') {
            throw new Error('Falha ao desbloquear skin');
          }
          
          if (newUserSkin) {
            await supabase
              .from('profiles')
              .update({ selected_skin: newUserSkin.id })
              .eq('id', user.id);
            
            setTimeout(() => {
              loadSkinsData();
            }, 100);
            const skin = allSkins.find(s => s.id === skinId);
            const skinName = skin?.display_name || 'Skin';
            toast.showSuccess(`${skinName} equipada com sucesso!`, 3000);
            setEquippingSkin(null);
            return;
          }
        }
      }
      
      const success = await equipSkin(user.id, skinId);
      if (success) {
        setTimeout(() => {
          loadSkinsData();
        }, 100);
        const skin = allSkins.find(s => s.id === skinId);
        const skinName = skin?.display_name || 'Skin';
        toast.showSuccess(`${skinName} equipada com sucesso!`, 3000);
      } else {
        toast.showError('Falha ao equipar skin. Tente novamente.');
      }
    } catch (error) {
      console.error('Error equipping skin:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao equipar skin';
      toast.showError(errorMessage);
    } finally {
      setEquippingSkin(null);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao fazer logout';
      toast.showError(`Erro ao fazer logout: ${errorMessage}`);
    }
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'há poucos segundos';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? 'há 1 minuto' : `há ${diffInMinutes} minutos`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? 'há 1 hora' : `há ${diffInHours} horas`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return diffInDays === 1 ? 'há 1 dia' : `há ${diffInDays} dias`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return diffInWeeks === 1 ? 'há 1 semana' : `há ${diffInWeeks} semanas`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return diffInMonths === 1 ? 'há 1 mês' : `há ${diffInMonths} meses`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return diffInYears === 1 ? 'há 1 ano' : `há ${diffInYears} anos`;
  };

  const renderProfileTab = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>Carregando...</div>;
    }

    const infoRowStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      fontSize: isMobile ? '14px' : '16px',
      padding: isMobile ? '12px 0' : '14px 0',
      transition: 'all 0.2s ease',
      position: 'relative',
    };

    const labelStyle: React.CSSProperties = {
      color: '#999',
      fontWeight: '500',
      fontSize: isMobile ? '13px' : '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    };

    const valueStyle = (highlight?: boolean): React.CSSProperties => ({
      color: highlight ? '#4ade80' : '#fff',
      fontWeight: '700',
      fontSize: isMobile ? '15px' : '17px',
      textShadow: highlight ? '0 0 8px rgba(74, 222, 128, 0.5)' : 'none',
    });

    return (
      <div style={{
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div 
          style={infoRowStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span style={labelStyle}>
            <span style={{ fontSize: '18px' }}>👤</span>
            Usuário
          </span>
          <span style={{ ...valueStyle(true), color: '#4ade80' }}>{profile?.username || 'Sem nome'}</span>
        </div>

        <div 
          style={infoRowStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span style={labelStyle}>
            <span style={{ fontSize: '18px' }}>📧</span>
            Email
          </span>
          <span style={valueStyle()}>{profile?.email || 'N/A'}</span>
        </div>

        <div 
          style={infoRowStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span style={labelStyle}>
            <span style={{ fontSize: '18px' }}>🎯</span>
            Nível Atual
          </span>
          <span style={valueStyle(true)}>{progress?.level || 1}</span>
        </div>

        <div 
          style={infoRowStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span style={labelStyle}>
            <span style={{ fontSize: '18px' }}>⬆️</span>
            Próximo Nível
          </span>
          <span style={valueStyle()}>{nextLevel}</span>
        </div>

        <div 
          style={infoRowStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          <span style={labelStyle}>
            <span style={{ fontSize: '18px' }}>🏆</span>
            Vitórias
          </span>
          <span style={valueStyle(true)}>{victoryCount}</span>
        </div>

        {progress?.last_played_at && (
          <div 
            style={infoRowStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <span style={labelStyle}>
              <span style={{ fontSize: '18px' }}>🕐</span>
              Última Jogada
            </span>
            <span style={valueStyle()}>
              {formatRelativeTime(progress.last_played_at)}
            </span>
          </div>
        )}

        {/* Botão de sair - apenas se for o próprio perfil */}
        {user && authProfile?.username === username && (
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #333' }}>
            <button
              onClick={handleLogout}
              onMouseEnter={() => setLogoutHovered(true)}
              onMouseLeave={() => setLogoutHovered(false)}
              style={{
                padding: isMobile ? '6px 12px' : '8px 14px',
                backgroundColor: logoutHovered ? '#2a1a1a' : 'transparent',
                border: '1px solid #666',
                color: '#ff4444',
                fontFamily: PIXEL_FONT,
                fontSize: isMobile ? '10px' : '11px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.2s ease',
                opacity: logoutHovered ? 1 : 0.8,
                width: '100%',
              }}
            >
              Sair
            </button>
          </div>
        )}

      </div>
    );
  };

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

    const isOwner = user?.id === profile?.id;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {cheatMode && isOwner && (
          <div style={{ 
            marginBottom: '12px', 
            padding: '8px', 
            backgroundColor: '#ff00ff22', 
            border: '2px solid #ff00ff',
            borderRadius: '4px',
            fontSize: isMobile ? '11px' : '12px', 
            color: '#ff00ff',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            🎮 CHEAT MODE ATIVO
          </div>
        )}

        <div style={{ 
          marginBottom: '16px', 
          fontSize: isMobile ? '12px' : '14px', 
          color: '#aaa',
          flexShrink: 0,
        }}>
          {userSkins.length} de {allSkins.length} skins
        </div>

        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: '8px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#666 #222',
          minHeight: 0,
          maxHeight: '100%',
          width: '100%',
          boxSizing: 'border-box',
        }}
        className="skins-gallery-scroll"
        >
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
            gap: isMobile ? '8px' : '12px',
            paddingBottom: '16px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
          {sortedSkins.map((skin) => {
            const isUnlocked = cheatMode || unlockedSkinIds.has(skin.id);
            const isEquipped = selectedSkinId === skin.id;
            const rarityColor = getRarityColor(skin.rarity);
            const isMystery = skin.is_mystery && !isUnlocked;
            
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
                    ? '2px solid #4ade80' 
                    : `1px solid ${rarityColor}`,
                  borderRadius: '4px',
                  padding: isMobile ? '6px' : '8px',
                  opacity: isUnlocked ? 1 : 0.5,
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {isEquipped && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: '#4ade80',
                    color: '#000',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    zIndex: 10,
                  }}>
                    ✓
                  </div>
                )}

                {!isUnlocked && !cheatMode && isMystery && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 5,
                    borderRadius: '4px',
                  }}>
                    <div 
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      }}
                      style={{
                        fontSize: isMobile ? '48px' : '64px',
                        color: rarityColor,
                        fontWeight: 'bold',
                        filter: `drop-shadow(0 0 8px ${rarityColor})`,
                        animation: 'pulse 2s ease-in-out infinite',
                        transition: 'transform 0.3s ease',
                        transform: 'scale(1) rotate(0deg)',
                      }}
                    >
                      ?
                    </div>
                  </div>
                )}
                {!isUnlocked && !cheatMode && !isMystery && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 5,
                    borderRadius: '4px',
                  }}>
                    <div style={{
                      fontSize: isMobile ? '32px' : '48px',
                      filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))',
                    }}>
                      🔒
                    </div>
                  </div>
                )}

                <div 
                  className={
                    skin.rarity === 'mythic' || skin.rarity === 'legendary' 
                      ? 'holo-effect holo-legendary' 
                      : skin.rarity === 'epic' 
                      ? 'holo-effect holo-epic' 
                      : ''
                  }
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    backgroundColor: '#000000',
                    borderRadius: '2px',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '15%',
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div 
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                    }}
                    style={{
                      width: '50%',
                      aspectRatio: '1',
                      backgroundColor: previewStyle.backgroundColor,
                      background: previewStyle.backgroundGradient || previewStyle.backgroundColor,
                      borderRadius: '2px',
                      border: `1px solid ${previewStyle.borderColor}`,
                      flexShrink: 0,
                      position: 'relative',
                      zIndex: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: previewStyle.boxShadow !== 'none' 
                        ? previewStyle.boxShadow 
                        : (skin.rarity === 'mythic'
                          ? `0 0 15px ${rarityColor}, 0 0 30px ${rarityColor}`
                          : skin.rarity === 'legendary'
                          ? `0 0 12px ${rarityColor}, 0 0 24px ${rarityColor}`
                          : skin.rarity === 'epic'
                          ? `0 0 10px ${rarityColor}, 0 0 20px ${rarityColor}`
                          : skin.rarity === 'rare'
                          ? `0 0 6px ${rarityColor}, 0 0 12px ${rarityColor}`
                          : 'none'),
                      animation: previewStyle.animation,
                      backgroundSize: previewStyle.backgroundGradient?.includes('rainbow') || previewStyle.backgroundGradient?.includes('mythic') ? '300% 100%' : 'auto',
                      transition: 'transform 0.3s ease',
                      transform: 'scale(1) rotate(0deg)',
                    }}
                    className={skin.rarity === 'mythic' || skin.rarity === 'legendary' || skin.rarity === 'epic' ? 'skin-glow' : ''}
                  >
                    {textureName && (textureName.includes('smiley') || textureName.includes('emoji')) && (
                      <span style={{
                        fontSize: isMobile ? '20px' : '28px',
                        lineHeight: '1',
                        zIndex: 4,
                      }}>
                        😀
                      </span>
                    )}
                  </div>
                  <div className="skin-glare" />
                </div>

                <div style={{ 
                  fontSize: isMobile ? '9px' : '10px',
                  fontWeight: '600',
                  color: rarityColor,
                  marginBottom: '4px',
                  textAlign: 'center',
                  lineHeight: '1.2',
                }}>
                  {isMystery ? '???' : skin.display_name}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '4px',
                  marginBottom: '4px',
                  width: '100%',
                }}>
                  <div style={{
                    padding: '1px 4px',
                    backgroundColor: '#333',
                    border: `1px solid ${rarityColor}`,
                    fontSize: isMobile ? '7px' : '8px',
                    textTransform: 'uppercase',
                    color: rarityColor,
                    borderRadius: '2px',
                  }}>
                    {skin.rarity}
                  </div>
                  {!isUnlocked && (
                    <div style={{
                      fontSize: '8px',
                      color: '#666',
                    }}>
                      🔒
                    </div>
                  )}
                </div>
                
                {isOwner && (isUnlocked || cheatMode) && (
                  <button
                    style={{
                      width: '100%',
                      padding: isMobile ? '4px' : '6px',
                      fontSize: isMobile ? '8px' : '9px',
                      backgroundColor: isEquipped ? '#1a2e1a' : cheatMode && !isUnlocked ? '#ff00ff22' : '#333',
                      border: isEquipped ? '1px solid #4ade80' : cheatMode && !isUnlocked ? '1px solid #ff00ff' : '1px solid #666',
                      color: cheatMode && !isUnlocked ? '#ff00ff' : '#fff',
                      fontFamily: PIXEL_FONT,
                      fontWeight: '600',
                      cursor: isEquipped ? 'default' : 'pointer',
                      opacity: equippingSkin === skin.id ? 0.6 : 1,
                      borderRadius: '2px',
                      textTransform: 'uppercase',
                      transition: 'all 0.15s ease',
                      transform: 'scale(1)',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isEquipped) handleEquipSkin(skin.id);
                    }}
                    disabled={isEquipped || equippingSkin === skin.id}
                    onMouseEnter={(e) => {
                      if (!isEquipped && equippingSkin !== skin.id) {
                        e.currentTarget.style.backgroundColor = isEquipped ? '#1a2e1a' : cheatMode && !isUnlocked ? '#ff00ff44' : '#444';
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.borderColor = isEquipped ? '#4ade80' : cheatMode && !isUnlocked ? '#ff00ff' : '#888';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isEquipped ? '#1a2e1a' : cheatMode && !isUnlocked ? '#ff00ff22' : '#333';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = isEquipped ? '#4ade80' : cheatMode && !isUnlocked ? '#ff00ff' : '#666';
                    }}
                    onMouseDown={(e) => {
                      if (!isEquipped && equippingSkin !== skin.id) {
                        e.currentTarget.style.transform = 'scale(0.95)';
                      }
                    }}
                    onMouseUp={(e) => {
                      if (!isEquipped && equippingSkin !== skin.id) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                  >
                    {equippingSkin === skin.id 
                      ? '...' 
                      : isEquipped 
                        ? '✓' 
                        : cheatMode && !isUnlocked
                        ? '+'
                        : 'Equip'}
                  </button>
                )}
              </div>
            );
          })}
          </div>
          
          {selectedSkinForModal && (
            <SkinDetailsModal
              skin={selectedSkinForModal}
              isUnlocked={cheatMode || unlockedSkinIds.has(selectedSkinForModal.id)}
              onClose={() => setSelectedSkinForModal(null)}
            />
          )}
        </div>
      </div>
    );
  };

  const copyError = () => {
    if (errorDetails) {
      navigator.clipboard.writeText(errorDetails).then(() => {
        alert('Error copied to clipboard!');
      }).catch((err) => {
        console.error('Failed to copy:', err);
        alert('Failed to copy error');
      });
    }
  };

  if (error) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: PIXEL_FONT,
        padding: isMobile ? '40px 20px' : '60px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '800px',
          width: '100%',
          backgroundColor: '#111',
          border: '4px solid #ff0000',
          padding: isMobile ? '24px' : '32px',
          boxShadow: '0 0 0 4px #333, 8px 8px 0px #333',
        }}>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: '700',
            marginBottom: '24px',
            color: '#ff0000',
            textAlign: 'center',
          }}>
            ⚠️ Erro ao Carregar Perfil
          </h1>
          
          <div style={{
            backgroundColor: '#222',
            border: '2px solid #666',
            padding: '16px',
            marginBottom: '20px',
            fontSize: isMobile ? '14px' : '16px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: '400px',
            overflow: 'auto',
          }}>
            <div style={{ color: '#ff6666', marginBottom: '12px', fontWeight: 'bold' }}>
              {error.message}
            </div>
            {errorDetails && (
              <details style={{ marginTop: '12px' }}>
                <summary style={{ cursor: 'pointer', color: '#aaa', marginBottom: '8px' }}>
                  Detalhes do Erro (clique para expandir)
                </summary>
                <pre style={{
                  color: '#ccc',
                  fontSize: isMobile ? '11px' : '12px',
                  margin: 0,
                  padding: '8px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                }}>
                  {errorDetails}
                </pre>
              </details>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={copyError}
              style={{
                padding: isMobile ? '12px 20px' : '14px 24px',
                backgroundColor: '#333',
                border: '3px solid #fff',
                color: '#fff',
                fontFamily: PIXEL_FONT,
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              📋 Copiar Erro
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: isMobile ? '12px 20px' : '14px 24px',
                backgroundColor: '#222',
                border: '3px solid #fff',
                color: '#fff',
                fontFamily: PIXEL_FONT,
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Voltar
            </button>
            <button
              onClick={() => {
                setError(null);
                setErrorDetails('');
                loadProfileData();
              }}
              style={{
                padding: isMobile ? '12px 20px' : '14px 24px',
                backgroundColor: '#333',
                border: '3px solid #4ade80',
                color: '#4ade80',
                fontFamily: PIXEL_FONT,
                fontSize: isMobile ? '12px' : '14px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: PIXEL_FONT,
      }}>
        Carregando...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: PIXEL_FONT,
        gap: '20px',
      }}>
        <div>Perfil não encontrado</div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#222',
            border: '3px solid #fff',
            color: '#fff',
            fontFamily: PIXEL_FONT,
            fontSize: '14px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Voltar
        </button>
      </div>
    );
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

  const isOwner = user?.id === profile.id;

  return (
    <>
      <style>{`
        .skin-glow {
          animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
          0% { filter: brightness(1); }
          100% { filter: brightness(1.3); }
        }
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
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%),
                      linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%),
                      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 255, 255, 0.03) 2px, rgba(255, 255, 255, 0.03) 4px);
          animation: holo-shine 3s linear infinite;
          pointer-events: none;
          z-index: 2;
          mix-blend-mode: overlay;
          will-change: transform;
        }
        .holo-effect::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3), transparent 50%),
                      radial-gradient(circle at 40% 20%, rgba(198, 119, 255, 0.3), transparent 50%);
          animation: holo-shift 4s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
          mix-blend-mode: color-dodge;
          opacity: 0.5;
          will-change: transform, opacity;
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
          background: linear-gradient(125deg, rgba(96, 165, 250, 0.1) 0%, rgba(59, 130, 246, 0.2) 25%, rgba(37, 99, 235, 0.1) 50%, rgba(59, 130, 246, 0.2) 75%, rgba(96, 165, 250, 0.1) 100%);
          background-size: 200% 200%;
          animation: holo-gradient 3s ease-in-out infinite;
        }
        .holo-epic {
          background: linear-gradient(125deg, rgba(167, 139, 250, 0.1) 0%, rgba(139, 92, 246, 0.2) 25%, rgba(124, 58, 237, 0.1) 50%, rgba(139, 92, 246, 0.2) 75%, rgba(167, 139, 250, 0.1) 100%);
          background-size: 200% 200%;
          animation: holo-gradient 3s ease-in-out infinite;
        }
        .holo-legendary {
          background: linear-gradient(125deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.25) 25%, rgba(217, 119, 6, 0.15) 50%, rgba(245, 158, 11, 0.25) 75%, rgba(251, 191, 36, 0.15) 100%);
          background-size: 200% 200%;
          animation: holo-gradient 2.5s ease-in-out infinite;
        }
        @keyframes holo-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .skin-glare {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 4;
          overflow: hidden;
          border-radius: 2px;
          background-image: radial-gradient(
            farthest-corner circle at 50% 50%,
            hsla(0, 0%, 100%, 0.8) 10%,
            hsla(0, 0%, 100%, 0.65) 20%,
            hsla(0, 0%, 0%, 0.5) 90%
          );
          background-size: 200% 200%;
          opacity: 0.6;
          mix-blend-mode: overlay;
          filter: brightness(0.8) contrast(1.5);
          animation: glare-sweep 4s ease-in-out infinite;
          will-change: background-position, transform;
        }
        @keyframes glare-sweep {
          0% {
            background-position: 0% 0%;
            transform: translate(0, 0) scale(1);
          }
          25% {
            background-position: 100% 0%;
            transform: translate(5%, -5%) scale(1.1);
          }
          50% {
            background-position: 100% 100%;
            transform: translate(0, 0) scale(1);
          }
          75% {
            background-position: 0% 100%;
            transform: translate(-5%, 5%) scale(1.1);
          }
          100% {
            background-position: 0% 0%;
            transform: translate(0, 0) scale(1);
          }
        }
        .skins-gallery-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .skins-gallery-scroll::-webkit-scrollbar-track {
          background: #222;
          border-radius: 4px;
        }
        .skins-gallery-scroll::-webkit-scrollbar-thumb {
          background: #666;
          border-radius: 4px;
        }
        .skins-gallery-scroll::-webkit-scrollbar-thumb:hover {
          background: #888;
        }
      `}</style>
      <div style={{
        height: '100vh',
        maxHeight: '100vh',
        background: '#000',
        color: '#fff',
        fontFamily: PIXEL_FONT,
        paddingTop: isMobile ? '40px' : '60px',
        paddingLeft: isMobile ? '16px' : '24px',
        paddingRight: isMobile ? '16px' : '24px',
        paddingBottom: isMobile ? '16px' : '24px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          boxSizing: 'border-box',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexShrink: 0,
          }}>
            <h1 style={{
              fontSize: isMobile ? '20px' : '28px',
              fontWeight: '700',
              margin: 0,
            }}>
              <span style={{ color: '#4ade80', textShadow: '0 0 8px rgba(74, 222, 128, 0.5)' }}>{profile.username}</span>'s Perfil
            </h1>
            <div style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}>
              <button
                onClick={() => navigate('/')}
                onMouseEnter={() => setVoltarHovered(true)}
                onMouseLeave={() => setVoltarHovered(false)}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  backgroundColor: voltarHovered ? '#333' : '#222',
                  border: '2px solid #fff',
                  color: '#fff',
                  fontFamily: PIXEL_FONT,
                  fontSize: isMobile ? '12px' : '14px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  transform: voltarHovered ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: voltarHovered ? '0 4px 8px rgba(255, 255, 255, 0.2)' : 'none',
                }}
              >
                Voltar
              </button>
              <button
                onClick={() => navigate('/')}
                onMouseEnter={() => setJogarHovered(true)}
                onMouseLeave={() => setJogarHovered(false)}
                style={{
                  padding: isMobile ? '8px 16px' : '10px 20px',
                  backgroundColor: jogarHovered ? '#5ade90' : '#4ade80',
                  border: '2px solid #fff',
                  color: '#000',
                  fontFamily: PIXEL_FONT,
                  fontSize: isMobile ? '12px' : '14px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  transform: jogarHovered ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: jogarHovered ? '0 4px 8px rgba(74, 222, 128, 0.4)' : 'none',
                }}
              >
                JOGAR
              </button>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '3px solid #666',
            flexShrink: 0,
            width: '100%',
          }}>
            <button
              onMouseEnter={() => setContaTabHovered(true)}
              onMouseLeave={() => setContaTabHovered(false)}
              style={{
                padding: isMobile ? '10px 16px' : '12px 24px',
                backgroundColor: activeTab === 'profile' ? '#222' : (contaTabHovered ? '#1a1a1a' : 'transparent'),
                border: activeTab === 'profile' ? '3px solid #fff' : (contaTabHovered ? '3px solid #888' : '3px solid transparent'),
                borderBottom: activeTab === 'profile' ? '3px solid #fff' : (contaTabHovered ? '3px solid #888' : '3px solid transparent'),
                color: activeTab === 'profile' ? '#fff' : (contaTabHovered ? '#999' : '#666'),
                fontFamily: PIXEL_FONT,
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '-3px',
                transition: 'all 0.2s ease',
                width: isMobile ? '180px' : '260px',
                minWidth: isMobile ? '180px' : '260px',
                maxWidth: isMobile ? '180px' : '260px',
                textAlign: 'center',
                boxSizing: 'border-box',
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setActiveTab('profile')}
            >
              Conta
            </button>
            <button
              onMouseEnter={() => setSkinsTabHovered(true)}
              onMouseLeave={() => setSkinsTabHovered(false)}
              style={{
                padding: isMobile ? '10px 16px' : '12px 24px',
                backgroundColor: activeTab === 'skins' ? '#222' : (skinsTabHovered ? '#1a1a1a' : 'transparent'),
                border: activeTab === 'skins' ? '3px solid #fff' : (skinsTabHovered ? '3px solid #888' : '3px solid transparent'),
                borderBottom: activeTab === 'skins' ? '3px solid #fff' : (skinsTabHovered ? '3px solid #888' : '3px solid transparent'),
                color: activeTab === 'skins' ? '#fff' : (skinsTabHovered ? '#999' : '#666'),
                fontFamily: PIXEL_FONT,
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '-3px',
                transition: 'all 0.2s ease',
                width: isMobile ? '180px' : '260px',
                minWidth: isMobile ? '180px' : '260px',
                maxWidth: isMobile ? '180px' : '260px',
                textAlign: 'center',
                boxSizing: 'border-box',
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setActiveTab('skins')}
            >
              Skins ({userSkins.length}/{allSkins.length})
            </button>
          </div>

          <div style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'skins' && renderSkinsTab()}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '24px',
            paddingBottom: '24px',
            borderTop: '1px solid #333',
            textAlign: 'center',
            color: '#666',
            fontSize: isMobile ? '11px' : '12px',
            fontFamily: PIXEL_FONT,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img 
                src="/logo/logo.svg" 
                alt="Boss Attack Logo" 
                style={{
                  width: isMobile ? '24px' : '32px',
                  height: isMobile ? '24px' : '32px',
                  imageRendering: 'pixelated' as any,
                }}
              />
              <span style={{ color: '#999', fontWeight: '600' }}>Boss Attack</span>
            </div>
            <div style={{ color: '#666', fontSize: isMobile ? '10px' : '11px' }}>
              © {new Date().getFullYear()} by Duspace
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
    </>
  );
}

