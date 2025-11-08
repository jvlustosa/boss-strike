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

  const skinCardStyle = (isUnlocked: boolean, isEquipped: boolean): React.CSSProperties => ({
    padding: isMobile ? '12px' : '16px',
    marginBottom: '12px',
    backgroundColor: isEquipped ? '#1a2e1a' : '#222',
    border: isEquipped ? '3px solid #4ade80' : '2px solid #666',
    opacity: isUnlocked ? 1 : 0.5,
  });

  const renderSkinsTab = () => {
    if (skinsLoading) {
      return <div style={{ textAlign: 'center', color: '#fff', padding: '40px' }}>Carregando skins...</div>;
    }

    const unlockedSkinIds = new Set(userSkins.map(us => us.skin_id));
    const equippedSkinId = userSkins.find(us => us.is_equipped)?.skin_id;

    return (
      <div>
        <div style={{ marginBottom: '20px', fontSize: isMobile ? '14px' : '16px', color: '#aaa' }}>
          Você possui {userSkins.length} de {allSkins.length} skins
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {allSkins.map((skin) => {
            const isUnlocked = unlockedSkinIds.has(skin.id);
            const isEquipped = equippedSkinId === skin.id;
            const userSkin = userSkins.find(us => us.skin_id === skin.id);

            return (
              <div key={skin.id} style={skinCardStyle(isUnlocked, isEquipped)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: isMobile ? '16px' : '18px', 
                      fontWeight: '600',
                      color: getRarityColor(skin.rarity),
                      marginBottom: '4px',
                    }}>
                      {skin.display_name}
                      {isEquipped && ' ✓'}
                    </div>
                    <div style={{ fontSize: isMobile ? '12px' : '13px', color: '#aaa', marginBottom: '4px' }}>
                      {skin.description || 'Sem descrição'}
                    </div>
                    <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#666' }}>
                      {skin.unlock_condition || 'Desbloqueio especial'}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: '#333',
                    border: `2px solid ${getRarityColor(skin.rarity)}`,
                    fontSize: isMobile ? '10px' : '11px',
                    textTransform: 'uppercase',
                    color: getRarityColor(skin.rarity),
                  }}>
                    {skin.rarity}
                  </div>
                </div>
                
                {isUnlocked && (
                  <button
                    style={{
                      ...buttonStyle(false),
                      marginTop: '8px',
                      padding: isMobile ? '10px' : '12px',
                      fontSize: isMobile ? '13px' : '14px',
                      backgroundColor: isEquipped ? '#1a2e1a' : '#222',
                      border: isEquipped ? '3px solid #4ade80' : '3px solid #666',
                      opacity: equippingSkin === skin.id ? 0.6 : 1,
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
                    padding: '8px',
                    backgroundColor: '#1a1a1a',
                    border: '2px solid #333',
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#666',
                    textAlign: 'center',
                  }}>
                    🔒 Bloqueada
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
  );
}

