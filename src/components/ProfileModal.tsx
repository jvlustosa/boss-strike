import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, GameProgress } from '../../supabase/supabase-structure';
import { getVictoryCount, getNextLevel } from '../game/core/progressCache';
import { parseSupabaseError } from '../utils/supabaseErrors';

interface ProfileModalProps {
  onClose: () => void;
  userId: string;
  showToast?: (message: string, errorCode?: string, duration?: number) => string;
}

export function ProfileModal({ onClose, userId, showToast }: ProfileModalProps) {
  const { profile: authProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progress, setProgress] = useState<GameProgress | null>(null);
  const [victoryCount, setVictoryCount] = useState(0);
  const [nextLevel, setNextLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [userId, authProfile]);

  const loadProfileData = async () => {
    try {
      // Use profile from auth context if available, otherwise fetch
      if (authProfile && authProfile.id === userId) {
        setProfile(authProfile);
      } else {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (profileData) setProfile(profileData as Profile);
      }

      const [progressData, victories, level] = await Promise.all([
        supabase.from('game_progress').select('*').eq('user_id', userId).single(),
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Auth context will handle clearing state automatically
      // Reload page to reset app state
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
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: '#111',
    border: '4px solid #fff',
    padding: isMobile ? '24px' : '32px',
    minWidth: isMobile ? '300px' : '400px',
    maxWidth: '90%',
    boxShadow: '0 0 0 4px #333, 8px 8px 0px #333',
    color: '#fff',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '24px' : '32px',
    fontWeight: '700',
    marginBottom: '24px',
    textAlign: 'center',
    textShadow: '2px 2px 0px #333',
    color: '#fff',
  };

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

  if (loading) {
    return (
      <div style={modalStyle}>
        <div style={contentStyle}>
          <div style={{ textAlign: 'center', color: '#fff' }}>Carregando...</div>
        </div>
      </div>
    );
  }

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
    </div>
  );
}

