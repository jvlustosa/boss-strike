import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLevelConfig, getMaxLevel } from '../game/core/levelLoader';
import { loadProgress } from '../game/core/progressCache';
import { PIXEL_FONT } from '../utils/fonts';
import { isMobile } from '../game/core/environmentDetector';
import { UserHeader } from './UserHeader';
import { useAuth } from '../contexts/AuthContext';

interface LevelsPageProps {
  onStartGame: (level: number) => void;
}

export function LevelsPage({ onStartGame }: LevelsPageProps) {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const maxLevel = getMaxLevel();
  const mobile = isMobile();

  useEffect(() => {
    const loadUnlockedLevel = async () => {
      const progress = await loadProgress();
      if (progress) {
        // Nível desbloqueado é o progresso atual + 1 (para poder jogar o próximo nível)
        setUnlockedLevel(Math.max(1, progress.level + 1));
      } else {
        // Se não há progresso, apenas nível 1 está desbloqueado
        setUnlockedLevel(1);
      }
    };
    loadUnlockedLevel();
  }, []);

  const handleLevelClick = (level: number) => {
    if (level <= unlockedLevel) {
      setSelectedLevel(level);
    }
  };

  const handleStartLevel = () => {
    if (selectedLevel) {
      onStartGame(selectedLevel);
      navigate('/');
    }
  };

  const handleCloseModal = () => {
    setSelectedLevel(null);
  };

  const isUnlocked = (level: number) => level <= unlockedLevel;
  const isLocked = (level: number) => level > unlockedLevel;
  const isCompleted = (level: number) => level < unlockedLevel;

  const getTrophiesForLevel = (level: number): number => {
    // Troféus são ganhos a cada 5 níveis (5, 10, 15, etc.)
    // Retorna quantos troféus foram ganhos até completar este nível
    return Math.floor(level / 5);
  };

  const getDifficulty = (level: number): 'easy' | 'medium' | 'hard' | 'extreme' => {
    const config = getLevelConfig(level);
    
    // Calcular score de dificuldade baseado em múltiplos fatores (0-100)
    let difficultyScore = 0;
    
    // HP do boss (0-30 pontos, normalizado para 0-600)
    difficultyScore += (config.bossHp / 600) * 30;
    
    // Velocidade dos braços (0-15 pontos, normalizado para 0-4.0)
    difficultyScore += (config.armMoveSpeed / 4.0) * 15;
    
    // Cooldown de tiro (menor = mais difícil) (0-15 pontos)
    // Cooldown varia de ~0.6 a 1.5, então (1.5 - cooldown) / 0.9 dá 0-1
    difficultyScore += ((1.5 - config.armShootCooldown) / 0.9) * 15;
    
    // Velocidade das balas (0-15 pontos, normalizado para 0-100)
    difficultyScore += (config.bossBulletSpeed / 100) * 15;
    
    // Complexidade do padrão de tiro (0-25 pontos)
    const patternComplexity = {
      'single': 0,
      'double': 5,
      'burst': 10,
      'spread': 15,
      'circular': 18,
      'alternating': 20,
      'wave': 22,
      'multi': 25,
      'ultimate': 25
    };
    const patternType = config.bulletPattern?.type || 'single';
    difficultyScore += patternComplexity[patternType as keyof typeof patternComplexity] || 0;
    
    // Garantir que está entre 0-100
    difficultyScore = Math.max(0, Math.min(100, difficultyScore));
    
    if (difficultyScore < 25) return 'easy';
    if (difficultyScore < 50) return 'medium';
    if (difficultyScore < 75) return 'hard';
    return 'extreme';
  };

  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard' | 'extreme') => {
    switch (difficulty) {
      case 'easy':
        return { bg: '#4ade80', border: '#22c55e', glow: 'rgba(74, 222, 128, 0.6)' };
      case 'medium':
        return { bg: '#f59e0b', border: '#d97706', glow: 'rgba(245, 158, 11, 0.6)' };
      case 'hard':
        return { bg: '#ef4444', border: '#dc2626', glow: 'rgba(239, 68, 68, 0.6)' };
      case 'extreme':
        return { bg: '#7c3aed', border: '#6d28d9', glow: 'rgba(124, 58, 237, 0.6)' };
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%)',
    padding: mobile ? '20px 10px' : '40px 20px',
    paddingTop: mobile ? '60px' : '80px',
    paddingBottom: mobile ? '100px' : '120px',
    fontFamily: PIXEL_FONT,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: mobile ? '24px' : '32px',
    marginBottom: mobile ? '20px' : '30px',
    textAlign: 'center',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
  };

  const roadmapStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: mobile ? '40px' : '50px',
    width: '100%',
    maxWidth: '600px',
    position: 'relative',
    paddingBottom: mobile ? '60px' : '80px',
  };

  const getPathSVG = () => {
    const nodeSize = mobile ? 60 : 80;
    const nodeSpacing = mobile ? 160 : 180;
    const offset = 60;
    const centerX = 300; // Centro do roadmap (600px / 2)
    const nodeOffsetY = nodeSize / 2 + 15; // Offset para colocar a linha abaixo dos círculos
    
    let path = '';
    
    for (let i = 0; i < maxLevel; i++) {
      const baseY = i * nodeSpacing;
      // Alternar entre esquerda e direita: pares à direita, ímpares à esquerda
      const currentOffset = (i % 2 === 0) ? offset : -offset;
      const x = centerX + currentOffset;
      
      // Posicionar nas cristas e vales: níveis pares no topo (crista), ímpares no fundo (vale)
      const waveOffset = (i % 2 === 0) ? -20 : 20; // Crista acima, vale abaixo
      const y = baseY + nodeOffsetY + waveOffset;
      
      if (i === 0) {
        // Começar do primeiro nó
        path += `M ${x} ${y} `;
        // Linha reta até o centro
        path += `L ${centerX} ${y} `;
      } else {
        const prevOffset = ((i - 1) % 2 === 0) ? offset : -offset;
        const prevX = centerX + prevOffset;
        const prevBaseY = (i - 1) * nodeSpacing;
        const prevWaveOffset = ((i - 1) % 2 === 0) ? -20 : 20;
        const prevY = prevBaseY + nodeOffsetY + prevWaveOffset;
        
        // Ponto médio vertical entre os dois nós
        const midY = (prevY + y) / 2;
        
        // Linha reta do nó anterior até o centro, depois do centro até o próximo nó
        path += `L ${centerX} ${prevY} `;
        path += `L ${centerX} ${midY} `;
        path += `L ${centerX} ${y} `;
        path += `L ${x} ${y} `;
      }
    }
    
    return path;
  };

  const levelItemStyle = (level: number): React.CSSProperties => {
    const unlocked = isUnlocked(level);
    const hovered = hoveredLevel === level;
    const locked = isLocked(level);
    // Alternar entre esquerda e direita: pares à direita, ímpares à esquerda
    const offset = (level % 2 === 0) ? 60 : -60;
    const isLeftSide = level % 2 !== 0; // Ímpares à esquerda
    const difficulty = getDifficulty(level);
    const difficultyColors = getDifficultyColor(difficulty);
    
    // Ajustar posição vertical para cristas e vales: pares acima, ímpares abaixo
    const waveOffset = (level % 2 === 0) ? '-20px' : '20px';

    return {
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      flexDirection: isLeftSide ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: mobile ? '12px' : '20px',
      width: '100%',
      cursor: locked ? 'not-allowed' : 'pointer',
      opacity: locked ? 0.5 : 1,
      transition: 'all 0.2s ease',
      transform: hovered && !locked 
        ? `scale(1.05) translateY(calc(-2px + ${waveOffset}))` 
        : `translateY(${waveOffset})`,
      marginLeft: offset > 0 ? `${offset}px` : '0',
      marginRight: offset < 0 ? `${Math.abs(offset)}px` : '0',
      padding: hovered && !locked ? '8px' : '4px',
      borderRadius: hovered && !locked ? '12px' : '8px',
      background: hovered && !locked 
        ? `linear-gradient(135deg, ${difficultyColors.bg}15 0%, ${difficultyColors.border}10 100%)`
        : 'transparent',
      border: hovered && !locked 
        ? `2px solid ${difficultyColors.border}40`
        : '2px solid transparent',
    };
  };

  const levelCircleStyle = (level: number): React.CSSProperties => {
    const unlocked = isUnlocked(level);
    const hovered = hoveredLevel === level;
    const locked = isLocked(level);
    const difficulty = getDifficulty(level);
    const difficultyColors = getDifficultyColor(difficulty);

    if (locked) {
      return {
        width: mobile ? '60px' : '80px',
        height: mobile ? '60px' : '80px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: mobile ? '20px' : '28px',
        fontWeight: 'bold',
        border: '3px solid #444',
        background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
        boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.05), 4px 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        position: 'relative',
        zIndex: 3,
      };
    }

    if (hovered) {
      return {
        width: mobile ? '60px' : '80px',
        height: mobile ? '60px' : '80px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: mobile ? '20px' : '28px',
        fontWeight: 'bold',
        border: `3px solid ${difficultyColors.border}`,
        background: `linear-gradient(145deg, ${difficultyColors.bg} 0%, ${difficultyColors.border} 50%, ${difficultyColors.bg} 100%)`,
        boxShadow: `inset 2px 2px 4px rgba(255, 255, 255, 0.3), inset -2px -2px 4px rgba(0, 0, 0, 0.2), 0 0 25px ${difficultyColors.glow}, 0 0 15px ${difficultyColors.glow}, 6px 6px 12px rgba(0, 0, 0, 0.4)`,
        transition: 'all 0.2s ease',
        transform: 'translateY(-2px)',
        position: 'relative',
        zIndex: 3,
      };
    }

    return {
      width: mobile ? '60px' : '80px',
      height: mobile ? '60px' : '80px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: mobile ? '20px' : '28px',
      fontWeight: 'bold',
      border: unlocked ? '3px solid #4ade80' : '3px solid #666',
      background: unlocked
        ? 'linear-gradient(145deg, #22c55e 0%, #16a34a 50%, #15803d 100%)'
        : 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
      boxShadow: unlocked 
        ? 'inset 2px 2px 4px rgba(255, 255, 255, 0.2), inset -2px -2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(74, 222, 128, 0.4), 4px 4px 8px rgba(0, 0, 0, 0.3)'
        : 'inset 2px 2px 4px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.05), 4px 4px 8px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s ease',
      position: 'relative',
      zIndex: 3,
    };
  };

  const levelInfoStyle = (level: number): React.CSSProperties => {
    const isLeftSide = level % 2 !== 0; // Ímpares à esquerda
    return {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: mobile ? '4px' : '6px',
      alignItems: isLeftSide ? 'flex-start' : 'flex-end',
      textAlign: isLeftSide ? 'left' : 'right',
    };
  };

  const levelNameStyle = (level: number): React.CSSProperties => {
    const locked = isLocked(level);
    const hovered = hoveredLevel === level;
    const difficulty = getDifficulty(level);
    const difficultyColors = getDifficultyColor(difficulty);
    
    return {
      fontSize: mobile ? '16px' : '20px',
      fontWeight: 'bold',
      color: locked ? '#666' : hovered ? difficultyColors.bg : '#fff',
      transition: 'color 0.2s ease',
    };
  };

  const getDifficultyLabel = (difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): string => {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Médio';
      case 'hard': return 'Difícil';
      case 'extreme': return 'Extremo';
    }
  };

  const getLevelStats = (level: number) => {
    const config = getLevelConfig(level);
    const patternType = config.bulletPattern?.type || 'single';
    
    const patternLabels: Record<string, string> = {
      'single': 'Tiro Único',
      'double': 'Duplo',
      'burst': 'Rajada',
      'spread': 'Espalhado',
      'circular': 'Circular',
      'alternating': 'Alternado',
      'wave': 'Onda',
      'multi': 'Múltiplo',
      'ultimate': 'Supremo'
    };

    const movementLabels: Record<string, string> = {
      'static': 'Estático',
      'horizontal': 'Horizontal',
      'vertical': 'Vertical',
      'circular': 'Circular',
      'figure8': 'Figura 8'
    };

    return {
      bossHp: config.bossHp,
      armSpeed: config.armMoveSpeed.toFixed(1),
      shootCooldown: config.armShootCooldown.toFixed(1),
      bulletSpeed: config.bossBulletSpeed,
      pattern: patternLabels[patternType] || patternType,
      movement: config.bossMovement?.type 
        ? movementLabels[config.bossMovement.type] || config.bossMovement.type
        : 'Nenhum',
    };
  };

  const levelNumberStyle = (level: number): React.CSSProperties => {
    const isLeftSide = level % 2 !== 0; // Ímpares à esquerda
    return {
      fontSize: mobile ? '12px' : '14px',
      color: '#999',
      textAlign: isLeftSide ? 'left' : 'right',
    };
  };

  const lockIconStyle: React.CSSProperties = {
    fontSize: mobile ? '24px' : '32px',
    color: '#666',
  };

  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  const nodeSize = mobile ? 60 : 80;
  const nodeSpacing = mobile ? 160 : 180;
  const pathWidth = mobile ? 10 : 14;
  const centerX = 300;

  return (
    <>
      {user && (
        <UserHeader 
          onProfileClick={() => {
            if (user && authProfile?.username) {
              navigate(`/profile/${authProfile.username}`);
            }
          }}
        />
      )}
      <div style={{
        position: 'fixed',
        top: mobile ? '12px' : '16px',
        left: mobile ? '12px' : '16px',
        zIndex: 1002,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: mobile ? '10px 16px' : '12px 20px',
            fontSize: mobile ? '12px' : '14px',
            fontFamily: PIXEL_FONT,
            background: '#222',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: '8px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            boxShadow: '0 0 0 2px #333, 4px 4px 0px #333',
            transition: 'none',
            imageRendering: 'pixelated' as any,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#333';
            e.currentTarget.style.boxShadow = 'inset 0 0 0 2px #fff, 0 0 0 2px #fff, 4px 4px 0px #333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#222';
            e.currentTarget.style.boxShadow = '0 0 0 2px #333, 4px 4px 0px #333';
          }}
        >
          ← Menu
        </button>
      </div>
      <div style={wrapperStyle}>
        <div style={containerStyle}>
          <h1 style={titleStyle}>FASES</h1>
          
          <div style={roadmapStyle}>
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: `${maxLevel * nodeSpacing}px`,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#16a34a" />
            </linearGradient>
            <filter id="blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
            </filter>
          </defs>
          <path
            d={getPathSVG()}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth={pathWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.4}
            filter="url(#blur)"
          />
        </svg>
        
        {levels.map((level) => {
          const config = getLevelConfig(level);
          const unlocked = isUnlocked(level);
          const locked = isLocked(level);

          return (
            <div
              key={level}
              style={levelItemStyle(level)}
              onMouseEnter={() => !locked && setHoveredLevel(level)}
              onMouseLeave={() => setHoveredLevel(null)}
              onClick={() => handleLevelClick(level)}
            >
              <div style={levelCircleStyle(level)}>
                {locked ? '🔒' : unlocked ? '🏆' : level}
              </div>
              
              <div style={levelInfoStyle(level)}>
                <div style={levelNameStyle(level)}>
                  {config.name}
                </div>
                <div style={levelNumberStyle(level)}>
                  Fase {level}
                  {hoveredLevel === level && !locked && (
                    <span style={{
                      marginLeft: level % 2 !== 0 ? '8px' : '0',
                      marginRight: level % 2 === 0 ? '8px' : '0',
                      fontSize: mobile ? '11px' : '12px',
                      color: getDifficultyColor(getDifficulty(level)).bg,
                      fontWeight: 'bold',
                    }}>
                      • {getDifficultyLabel(getDifficulty(level))}
                    </span>
                  )}
                  {isCompleted(level) && getTrophiesForLevel(level) > 0 && (
                    <span style={{
                      marginLeft: level % 2 !== 0 ? '8px' : '0',
                      marginRight: level % 2 === 0 ? '8px' : '0',
                      fontSize: mobile ? '12px' : '14px',
                      color: '#ffd700',
                      fontWeight: 'bold',
                    }}>
                      🏆 {getTrophiesForLevel(level)}
                    </span>
                  )}
                </div>
                {hoveredLevel === level && !locked && (
                  <div style={{
                    marginTop: mobile ? '8px' : '12px',
                    padding: mobile ? '8px 12px' : '12px 16px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: `2px solid ${getDifficultyColor(getDifficulty(level)).border}60`,
                    borderRadius: '8px',
                    fontSize: mobile ? '10px' : '12px',
                    lineHeight: '1.6',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: mobile ? '4px' : '6px',
                    alignItems: level % 2 !== 0 ? 'flex-start' : 'flex-end',
                    textAlign: level % 2 !== 0 ? 'left' : 'right',
                  }}>
                    {(() => {
                      const stats = getLevelStats(level);
                      return (
                        <>
                          <div style={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}>
                            Estatísticas:
                          </div>
                          <div style={{ color: '#ccc' }}>
                            <div>❤️ HP: {stats.bossHp}</div>
                            <div>⚡ Vel. Braços: {stats.armSpeed}</div>
                            <div>⏱️ Cooldown: {stats.shootCooldown}s</div>
                            <div>💨 Vel. Balas: {stats.bulletSpeed}</div>
                            <div>🎯 Padrão: {stats.pattern}</div>
                            {stats.movement !== 'Nenhum' && (
                              <div>🏃 Movimento: {stats.movement}</div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
        
        <div style={{
          marginTop: mobile ? '40px' : '60px',
          padding: mobile ? '20px' : '30px',
          textAlign: 'center',
          opacity: 0.7,
        }}>
          <div style={{
            fontSize: mobile ? '18px' : '24px',
            marginBottom: mobile ? '10px' : '15px',
            lineHeight: '1.1',
            fontFamily: 'monospace',
            color: '#4ade80',
            textShadow: '2px 2px 0px #000, 0 0 10px rgba(74, 222, 128, 0.5)',
            imageRendering: 'pixelated' as any,
            letterSpacing: '1px',
          }}>
            <div> ░ </div>
            <div> ░ ░ </div>
            <div> ░ ░ ░ </div>
            <div> ░ ░ </div>
            <div style={{ marginTop: '2px' }}> ░ </div>
          </div>
          <div style={{
            fontSize: mobile ? '16px' : '20px',
            color: '#999',
            fontFamily: PIXEL_FONT,
            textShadow: '1px 1px 0px #333',
          }}>
            Mais em breve
          </div>
        </div>
        </div>
      </div>

      {selectedLevel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: mobile ? '20px' : '40px',
        }} onClick={handleCloseModal}>
          <div style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%)',
            border: '4px solid #fff',
            borderRadius: '12px',
            padding: mobile ? '20px' : '30px',
            maxWidth: mobile ? '90%' : '500px',
            width: '100%',
            fontFamily: PIXEL_FONT,
            color: '#fff',
            boxShadow: '0 0 0 4px #333, 8px 8px 0px #333',
            position: 'relative',
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: '#222',
                border: '2px solid #fff',
                borderRadius: '50%',
                width: mobile ? '32px' : '36px',
                height: mobile ? '32px' : '36px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: mobile ? '18px' : '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: PIXEL_FONT,
                boxShadow: '2px 2px 0px #333',
              }}
            >
              ×
            </button>

            {(() => {
              const config = getLevelConfig(selectedLevel);
              const difficulty = getDifficulty(selectedLevel);
              const difficultyColors = getDifficultyColor(difficulty);
              const stats = getLevelStats(selectedLevel);
              const isCompleted = selectedLevel < unlockedLevel;

              return (
                <>
                  <h2 style={{
                    fontSize: mobile ? '20px' : '24px',
                    marginBottom: mobile ? '15px' : '20px',
                    textAlign: 'center',
                    color: difficultyColors.bg,
                    textShadow: '2px 2px 0px #333',
                  }}>
                    {config.name}
                  </h2>

                  <div style={{
                    marginBottom: mobile ? '15px' : '20px',
                    padding: mobile ? '12px' : '16px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '8px',
                    border: `2px solid ${difficultyColors.border}60`,
                  }}>
                    <div style={{
                      fontSize: mobile ? '12px' : '14px',
                      lineHeight: '1.8',
                      color: '#ccc',
                    }}>
                      <div style={{ marginBottom: '8px', color: '#fff', fontWeight: 'bold' }}>
                        Dificuldade: <span style={{ color: difficultyColors.bg }}>{getDifficultyLabel(difficulty)}</span>
                      </div>
                      <div>❤️ HP do Boss: {stats.bossHp}</div>
                      <div>⚡ Velocidade dos Braços: {stats.armSpeed}</div>
                      <div>⏱️ Cooldown de Tiro: {stats.shootCooldown}s</div>
                      <div>💨 Velocidade das Balas: {stats.bulletSpeed}</div>
                      <div>🎯 Padrão de Tiro: {stats.pattern}</div>
                      {stats.movement !== 'Nenhum' && (
                        <div>🏃 Movimento: {stats.movement}</div>
                      )}
                      {isCompleted && getTrophiesForLevel(selectedLevel) > 0 && (
                        <div style={{ marginTop: '8px', color: '#ffd700' }}>
                          🏆 Troféus Ganhos: {getTrophiesForLevel(selectedLevel)}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleStartLevel}
                    style={{
                      width: '100%',
                      padding: mobile ? '14px 20px' : '16px 24px',
                      fontSize: mobile ? '14px' : '16px',
                      fontFamily: PIXEL_FONT,
                      fontWeight: 'bold',
                      color: '#000',
                      background: `linear-gradient(135deg, ${difficultyColors.bg} 0%, ${difficultyColors.border} 100%)`,
                      border: `3px solid ${difficultyColors.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      boxShadow: `0 0 20px ${difficultyColors.glow}, 4px 4px 0px #333`,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 0 25px ${difficultyColors.glow}, 6px 6px 0px #333`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 0 20px ${difficultyColors.glow}, 4px 4px 0px #333`;
                    }}
                  >
                    {isCompleted ? 'JOGAR NOVAMENTE' : 'CONTINUAR'}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

