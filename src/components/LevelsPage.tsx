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
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; delay: number; duration: number }>>([]);
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

  // Gerar estrelas pixeladas esparsas
  useEffect(() => {
    const starCount = mobile ? 30 : 50;
    const newStars = Array.from({ length: starCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
    }));
    setStars(newStars);
  }, [mobile]);

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
    // Distribuição fixa baseada no número do nível:
    // 3 primeiras: Fácil (níveis 1-3)
    // 3 seguintes: Médio (níveis 4-6)
    // 2 seguintes: Difícil (níveis 7-8)
    // 2 últimas: Extremo (níveis 9-10)
    if (level <= 3) return 'easy';
    if (level <= 6) return 'medium';
    if (level <= 8) return 'hard';
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
    background: 'linear-gradient(180deg, #000000 0%, #050510 50%, #000000 100%)',
    padding: mobile ? '20px 10px' : '40px 20px',
    paddingTop: mobile ? '60px' : '80px',
    paddingBottom: mobile ? '100px' : '120px',
    fontFamily: PIXEL_FONT,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowX: 'visible',
    overflowY: 'auto',
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflowY: 'auto',
    overflowX: 'visible',
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
    overflow: 'visible',
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
    const locked = isLocked(level);
    // Alternar entre esquerda e direita: pares à direita, ímpares à esquerda
    const offset = (level % 2 === 0) ? 60 : -60;
    const isLeftSide = level % 2 !== 0; // Ímpares à esquerda
    
    // Ajustar posição vertical para cristas e vales: pares acima, ímpares abaixo
    const waveOffset = (level % 2 === 0) ? '-20px' : '20px';

    return {
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: isLeftSide ? 'flex-start' : 'flex-end',
      gap: mobile ? '8px' : '12px',
      width: '100%',
      cursor: locked ? 'not-allowed' : 'pointer',
      opacity: locked ? 0.5 : 1,
      transform: `translateY(${waveOffset})`,
      marginLeft: offset > 0 ? `${offset}px` : '0',
      marginRight: offset < 0 ? `${Math.abs(offset)}px` : '0',
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
        border: unlocked ? '3px solid #4ade80' : '3px solid #666',
        background: unlocked
          ? 'linear-gradient(145deg, #22c55e 0%, #16a34a 50%, #15803d 100%)'
          : 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
        boxShadow: unlocked 
          ? 'inset 2px 2px 4px rgba(255, 255, 255, 0.2), inset -2px -2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(74, 222, 128, 0.4), 4px 4px 8px rgba(0, 0, 0, 0.3)'
          : 'inset 2px 2px 4px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.05), 4px 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        transform: 'scale(1.15)',
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
      display: 'flex',
      flexDirection: 'column',
      gap: mobile ? '4px' : '6px',
      alignItems: isLeftSide ? 'flex-start' : 'flex-end',
      textAlign: isLeftSide ? 'left' : 'right',
    };
  };

  const levelNameStyle = (level: number): React.CSSProperties => {
    const locked = isLocked(level);
    
    return {
      fontSize: mobile ? '16px' : '20px',
      fontWeight: 'bold',
      color: locked ? '#666' : '#fff',
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

  // Funções para renderizar planetas pixelados
  // Proporções reais: Marte (0.53), Saturno (9.4), Júpiter (11.2), Netuno (3.9) - relativos à Terra
  // Usando Júpiter como referência máxima e escalando os outros proporcionalmente
  const renderMars = () => {
    const jupiterMax = mobile ? 140 : 170;
    const marsBase = Math.max(40, Math.round(jupiterMax * (0.53 / 11.2)));
    const size = marsBase;
    const nodeSpacing = mobile ? 160 : 180;
    return (
      <div style={{
        position: 'absolute',
        left: mobile ? '-15%' : '-20%',
        top: `${nodeSpacing * 0.5}px`,
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated' as any,
        zIndex: 0,
        opacity: 0.4,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #ff6b4a, #cc4422, #8b2e1a)',
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255, 107, 74, 0.3)',
          border: '2px solid #8b2e1a',
          position: 'relative',
        }}>
          {/* Detalhes pixelados de Marte */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: '8px',
            height: '8px',
            background: '#8b2e1a',
            borderRadius: '2px',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '60%',
            width: '6px',
            height: '6px',
            background: '#cc4422',
            borderRadius: '2px',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '25%',
            left: '20%',
            width: '10px',
            height: '4px',
            background: '#8b2e1a',
            borderRadius: '2px',
          }} />
        </div>
      </div>
    );
  };

  const renderSaturn = () => {
    const jupiterMax = mobile ? 140 : 170;
    const saturnBase = Math.round(jupiterMax * (9.4 / 11.2));
    const size = saturnBase;
    const ringSize = Math.round(size * 1.4); // Anéis 40% maiores que o planeta
    const nodeSpacing = mobile ? 160 : 180;
    return (
      <div style={{
        position: 'absolute',
        right: mobile ? '-18%' : '-25%',
        top: `${nodeSpacing * 2.5}px`,
        width: `${ringSize}px`,
        height: `${ringSize}px`,
        imageRendering: 'pixelated' as any,
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.4,
        pointerEvents: 'none',
      }}>
        {/* Anéis de Saturno */}
        <div style={{
          position: 'absolute',
          width: `${ringSize}px`,
          height: `${ringSize * 0.3}px`,
          border: '3px solid #d4a574',
          borderTop: 'none',
          borderBottom: 'none',
          borderRadius: '50%',
          boxShadow: 'inset 0 0 10px rgba(212, 165, 116, 0.5)',
        }} />
        <div style={{
          position: 'absolute',
          width: `${ringSize * 0.85}px`,
          height: `${ringSize * 0.25}px`,
          border: '2px solid #b8956a',
          borderTop: 'none',
          borderBottom: 'none',
          borderRadius: '50%',
        }} />
        {/* Planeta */}
        <div style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #fad5a5, #d4a574, #b8956a)',
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.3), 0 0 10px rgba(244, 213, 165, 0.3)',
          border: '2px solid #b8956a',
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Faixas de Saturno */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '10%',
            width: '80%',
            height: '3px',
            background: '#b8956a',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '15%',
            width: '70%',
            height: '2px',
            background: '#d4a574',
          }} />
        </div>
      </div>
    );
  };

  const renderJupiter = () => {
    const jupiterMax = mobile ? 140 : 170;
    const size = jupiterMax;
    const nodeSpacing = mobile ? 160 : 180;
    return (
      <div style={{
        position: 'absolute',
        left: mobile ? '-25%' : '-30%',
        top: `${nodeSpacing * 4.5}px`,
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated' as any,
        zIndex: 0,
        opacity: 0.4,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#c9aa6b',
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.4)',
          border: '2px solid #a67c52',
          position: 'relative',
          imageRendering: 'pixelated' as any,
        }}>
          {/* Base pixelada com blocos */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '20%',
            height: '15%',
            background: '#d8ca9d',
            imageRendering: 'pixelated' as any,
          }} />
          <div style={{
            position: 'absolute',
            top: '25%',
            left: '5%',
            width: '25%',
            height: '12%',
            background: '#a67c52',
            imageRendering: 'pixelated' as any,
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            right: '15%',
            width: '18%',
            height: '10%',
            background: '#d8ca9d',
            imageRendering: 'pixelated' as any,
          }} />
          
          {/* Faixas de Júpiter pixeladas */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '5%',
            width: '90%',
            height: '4px',
            background: '#a67c52',
            imageRendering: 'pixelated' as any,
          }} />
          <div style={{
            position: 'absolute',
            top: '35%',
            left: '10%',
            width: '80%',
            height: '3px',
            background: '#c9aa6b',
            imageRendering: 'pixelated' as any,
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '8%',
            width: '84%',
            height: '5px',
            background: '#a67c52',
            imageRendering: 'pixelated' as any,
          }} />
          <div style={{
            position: 'absolute',
            bottom: '25%',
            left: '12%',
            width: '76%',
            height: '3px',
            background: '#c9aa6b',
            imageRendering: 'pixelated' as any,
          }} />
          
          {/* Grande Mancha Vermelha pixelada */}
          <div style={{
            position: 'absolute',
            top: '40%',
            right: '15%',
            width: '20px',
            height: '12px',
            background: '#cc4422',
            border: '1px solid #8b2e1a',
            imageRendering: 'pixelated' as any,
          }}>
            {/* Detalhes pixelados da mancha */}
            <div style={{
              position: 'absolute',
              top: '2px',
              left: '3px',
              width: '4px',
              height: '3px',
              background: '#8b2e1a',
            }} />
            <div style={{
              position: 'absolute',
              bottom: '2px',
              right: '3px',
              width: '3px',
              height: '2px',
              background: '#8b2e1a',
            }} />
          </div>
        </div>
      </div>
    );
  };

  const renderNeptune = () => {
    const jupiterMax = mobile ? 140 : 170;
    const neptuneBase = Math.round(jupiterMax * (3.9 / 11.2));
    const size = neptuneBase;
    const nodeSpacing = mobile ? 160 : 180;
    return (
      <div style={{
        position: 'absolute',
        right: mobile ? '-12%' : '-18%',
        top: `${nodeSpacing * 7.5}px`,
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated' as any,
        zIndex: 0,
        opacity: 0.4,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #4b70dd, #4166d1, #2d4a9e)',
          boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.5), 0 0 15px rgba(75, 112, 221, 0.4)',
          border: '2px solid #2d4a9e',
          position: 'relative',
        }}>
          {/* Padrões de nuvens de Netuno */}
          <div style={{
            position: 'absolute',
            top: '25%',
            left: '20%',
            width: '12px',
            height: '6px',
            background: '#5b80ed',
            borderRadius: '3px',
            opacity: 0.7,
          }} />
          <div style={{
            position: 'absolute',
            top: '45%',
            right: '25%',
            width: '10px',
            height: '5px',
            background: '#5b80ed',
            borderRadius: '3px',
            opacity: 0.7,
          }} />
          <div style={{
            position: 'absolute',
            bottom: '30%',
            left: '30%',
            width: '14px',
            height: '4px',
            background: '#5b80ed',
            borderRadius: '2px',
            opacity: 0.6,
          }} />
        </div>
      </div>
    );
  };

  const renderSun = () => {
    const sunSize = mobile ? 100 : 120;
    const glowSize = mobile ? 400 : 500;
    return (
      <>
        {/* Efeito de luz gradiente do sol */}
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: `${glowSize}px`,
          height: `${glowSize}px`,
          background: `radial-gradient(circle at top right, 
            rgba(255, 200, 50, 0.15) 0%, 
            rgba(255, 180, 40, 0.1) 20%, 
            rgba(255, 150, 30, 0.05) 40%, 
            rgba(255, 100, 20, 0.02) 60%, 
            transparent 80%)`,
          pointerEvents: 'none',
          zIndex: 0,
          transform: 'translate(30%, -30%)',
        }} />
        
        {/* Sol com efeito de fogo nuclear */}
        <div style={{
          position: 'fixed',
          top: mobile ? '20px' : '30px',
          right: mobile ? '20px' : '30px',
          width: `${sunSize}px`,
          height: `${sunSize}px`,
          imageRendering: 'pixelated' as any,
          zIndex: 1,
          pointerEvents: 'none',
        }}>
          {/* Chamas nucleares animadas */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${sunSize * 1.3}px`,
            height: `${sunSize * 1.3}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 100, 0, 0.4) 0%, rgba(255, 200, 0, 0.2) 40%, transparent 70%)',
            animation: 'nuclearFlame 2s ease-in-out infinite',
            filter: 'blur(2px)',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${sunSize * 1.5}px`,
            height: `${sunSize * 1.5}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 150, 0, 0.3) 0%, rgba(255, 220, 0, 0.15) 50%, transparent 80%)',
            animation: 'nuclearFlame 3s ease-in-out infinite reverse',
            filter: 'blur(3px)',
          }} />
          
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #ffeb3b, #ffc107, #ff9800, #ff5722)',
            boxShadow: `
              0 0 ${sunSize * 0.5}px rgba(255, 235, 59, 0.6),
              0 0 ${sunSize * 0.8}px rgba(255, 193, 7, 0.4),
              0 0 ${sunSize * 1.2}px rgba(255, 152, 0, 0.3),
              inset -4px -4px 8px rgba(0, 0, 0, 0.3),
              inset 4px 4px 8px rgba(255, 255, 255, 0.2)
            `,
            border: '2px solid #ff9800',
            position: 'relative',
            animation: 'sunPulse 4s ease-in-out infinite',
          }}>
            {/* Muitas manchas solares */}
            <div style={{
              position: 'absolute',
              top: '15%',
              left: '25%',
              width: '10px',
              height: '10px',
              background: '#ff9800',
              borderRadius: '50%',
              opacity: 0.7,
            }} />
            <div style={{
              position: 'absolute',
              top: '25%',
              left: '30%',
              width: '12px',
              height: '12px',
              background: '#ff9800',
              borderRadius: '50%',
              opacity: 0.6,
            }} />
            <div style={{
              position: 'absolute',
              top: '35%',
              left: '20%',
              width: '8px',
              height: '8px',
              background: '#ff5722',
              borderRadius: '50%',
              opacity: 0.8,
            }} />
            <div style={{
              position: 'absolute',
              top: '45%',
              left: '15%',
              width: '14px',
              height: '14px',
              background: '#ff9800',
              borderRadius: '50%',
              opacity: 0.65,
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '25%',
              width: '8px',
              height: '8px',
              background: '#ff5722',
              borderRadius: '50%',
              opacity: 0.7,
            }} />
            <div style={{
              position: 'absolute',
              top: '55%',
              right: '20%',
              width: '11px',
              height: '11px',
              background: '#ffc107',
              borderRadius: '50%',
              opacity: 0.75,
            }} />
            <div style={{
              position: 'absolute',
              top: '60%',
              right: '30%',
              width: '9px',
              height: '9px',
              background: '#ff5722',
              borderRadius: '50%',
              opacity: 0.7,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '30%',
              left: '40%',
              width: '10px',
              height: '10px',
              background: '#ffc107',
              borderRadius: '50%',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '25%',
              left: '50%',
              width: '12px',
              height: '12px',
              background: '#ff9800',
              borderRadius: '50%',
              opacity: 0.6,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '20%',
              right: '35%',
              width: '7px',
              height: '7px',
              background: '#ff5722',
              borderRadius: '50%',
              opacity: 0.8,
            }} />
            <div style={{
              position: 'absolute',
              top: '20%',
              right: '20%',
              width: '9px',
              height: '9px',
              background: '#ffc107',
              borderRadius: '50%',
              opacity: 0.65,
            }} />
            <div style={{
              position: 'absolute',
              top: '40%',
              right: '15%',
              width: '13px',
              height: '13px',
              background: '#ff9800',
              borderRadius: '50%',
              opacity: 0.7,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '40%',
              left: '25%',
              width: '8px',
              height: '8px',
              background: '#ff5722',
              borderRadius: '50%',
              opacity: 0.75,
            }} />
            <div style={{
              position: 'absolute',
              top: '30%',
              left: '50%',
              width: '6px',
              height: '6px',
              background: '#ffc107',
              borderRadius: '50%',
              opacity: 0.6,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '35%',
              right: '40%',
              width: '10px',
              height: '10px',
              background: '#ff9800',
              borderRadius: '50%',
              opacity: 0.7,
            }} />
          </div>
        </div>
      </>
    );
  };

  const renderMilkyWay = () => {
    const galaxySize = mobile ? 400 : 500;
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${galaxySize}px`,
          height: `${galaxySize * 0.3}px`,
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'galaxyRotate 30s linear infinite',
        }}
      >
        {/* Núcleo da galáxia */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${galaxySize * 0.15}px`,
            height: `${galaxySize * 0.15}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 200, 0.4) 0%, rgba(255, 200, 100, 0.3) 30%, rgba(200, 150, 100, 0.2) 60%, transparent 100%)',
            boxShadow: '0 0 40px rgba(255, 255, 200, 0.3)',
            filter: 'blur(2px)',
          }}
        />
        
        {/* Braços espirais da galáxia */}
        {Array.from({ length: 4 }, (_, i) => {
          const angle = (i * 90) - 45;
          const armLength = galaxySize * 0.4;
          return (
            <div
              key={`arm-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: `${armLength}px`,
                height: '3px',
                background: `linear-gradient(to right, 
                  rgba(255, 255, 200, 0.3) 0%, 
                  rgba(200, 180, 255, 0.25) 20%, 
                  rgba(150, 150, 255, 0.2) 40%, 
                  rgba(100, 100, 200, 0.15) 60%, 
                  transparent 100%)`,
                transformOrigin: '0 50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                filter: 'blur(1px)',
                animation: `galaxyRotate 30s linear infinite`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
              }}
            />
          );
        })}
        
        {/* Partículas estelares */}
        {Array.from({ length: 20 }, (_, i) => {
          const angle = (i * 18) * (Math.PI / 180);
          const distance = galaxySize * (0.2 + (i % 3) * 0.1);
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance * 0.3;
          return (
            <div
              key={`star-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                width: '2px',
                height: '2px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '50%',
                boxShadow: '0 0 3px rgba(255, 255, 255, 0.6)',
                animation: `galaxyRotate 30s linear infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          );
        })}
      </div>
    );
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
          {/* Estrelas cintilantes pixeladas */}
          {stars.map((star, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${Math.ceil(star.size)}px`,
                height: `${Math.ceil(star.size)}px`,
                background: '#fff',
                borderRadius: star.size <= 2 ? '0' : '50%',
                boxShadow: `0 0 ${Math.ceil(star.size * 1.5)}px #fff, 0 0 ${Math.ceil(star.size * 3)}px rgba(255, 255, 255, 0.4)`,
                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
                imageRendering: 'pixelated' as any,
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
          ))}
          
          <style>{`
            @keyframes twinkle {
              0%, 100% { 
                opacity: 0.4; 
                transform: scale(1); 
                filter: brightness(0.8);
              }
              50% { 
                opacity: 1; 
                transform: scale(1.3); 
                filter: brightness(1.2);
              }
            }
            @keyframes nuclearFlame {
              0%, 100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.6;
              }
              25% {
                transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
                opacity: 0.8;
              }
              50% {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.7;
              }
              75% {
                transform: translate(-50%, -50%) scale(1.05) rotate(-5deg);
                opacity: 0.75;
              }
            }
            @keyframes sunPulse {
              0%, 100% {
                box-shadow: 
                  0 0 60px rgba(255, 235, 59, 0.6),
                  0 0 96px rgba(255, 193, 7, 0.4),
                  0 0 144px rgba(255, 152, 0, 0.3),
                  inset -4px -4px 8px rgba(0, 0, 0, 0.3),
                  inset 4px 4px 8px rgba(255, 255, 255, 0.2);
              }
              50% {
                box-shadow: 
                  0 0 80px rgba(255, 235, 59, 0.8),
                  0 0 120px rgba(255, 193, 7, 0.6),
                  0 0 180px rgba(255, 152, 0, 0.5),
                  inset -4px -4px 8px rgba(0, 0, 0, 0.3),
                  inset 4px 4px 8px rgba(255, 255, 255, 0.3);
              }
            }
            @keyframes galaxyRotate {
              0% {
                transform: translate(-50%, -50%) rotate(0deg);
              }
              100% {
                transform: translate(-50%, -50%) rotate(360deg);
              }
            }
          `}</style>
          
          {/* Sol com efeito de luz - fixo na tela */}
          {renderSun()}
          
          <h1 style={titleStyle}>FASES</h1>
          
          <div style={roadmapStyle}>
            {/* Planetas pixelados */}
            {renderMars()}
            {renderSaturn()}
            {renderJupiter()}
            {renderNeptune()}
            
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
              <div style={levelInfoStyle(level)}>
                <div style={levelNameStyle(level)}>
                  {config.name}
                </div>
                <div style={levelNumberStyle(level)}>
                  Fase {level}
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
              </div>
              
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={levelCircleStyle(level)}>
                  {locked ? '🔒' : unlocked ? '🏆' : level}
                </div>
                
                {hoveredLevel === level && !locked && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: level % 2 !== 0 ? (mobile ? 'calc(100% + 12px)' : 'calc(100% + 20px)') : 'auto',
                    right: level % 2 === 0 ? (mobile ? 'calc(100% + 12px)' : 'calc(100% + 20px)') : 'auto',
                    transform: 'translateY(-50%)',
                    zIndex: 1000,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                  <div style={{
                    background: 'linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%)',
                    border: '3px solid #fff',
                    borderRadius: '4px',
                    padding: mobile ? '8px 10px' : '10px 12px',
                    fontFamily: PIXEL_FONT,
                    fontSize: mobile ? '9px' : '10px',
                    color: '#fff',
                    boxShadow: '0 0 0 3px #333, 4px 4px 0px #333',
                    imageRendering: 'pixelated' as any,
                    minWidth: mobile ? '140px' : '160px',
                    lineHeight: '1.4',
                  }}>
                    <div style={{
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      color: getDifficultyColor(getDifficulty(level)).bg,
                      textShadow: '1px 1px 0px #000',
                    }}>
                      {getDifficultyLabel(getDifficulty(level)).toUpperCase()}
                    </div>
                    {(() => {
                      const stats = getLevelStats(level);
                      return (
                        <div style={{ color: '#ccc', fontSize: mobile ? '8px' : '9px' }}>
                          <div>❤️ HP: {stats.bossHp}</div>
                          <div>⚡ Vel: {stats.armSpeed}</div>
                          <div>⏱️ CD: {stats.shootCooldown}s</div>
                          <div>💨 Balas: {stats.bulletSpeed}</div>
                          <div>🎯 {stats.pattern}</div>
                          {stats.movement !== 'Nenhum' && (
                            <div>🏃 {stats.movement}</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
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
          position: 'relative',
          minHeight: mobile ? '200px' : '300px',
        }}>
          {/* Via Láctea rotacionando */}
          {renderMilkyWay()}
          
          <div style={{
            fontSize: mobile ? '18px' : '24px',
            marginBottom: mobile ? '10px' : '15px',
            lineHeight: '1.1',
            fontFamily: 'monospace',
            color: '#4ade80',
            textShadow: '2px 2px 0px #000, 0 0 10px rgba(74, 222, 128, 0.5)',
            imageRendering: 'pixelated' as any,
            letterSpacing: '1px',
            position: 'relative',
            zIndex: 1,
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
            position: 'relative',
            zIndex: 1,
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
                      background: isCompleted
                        ? 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)'
                        : `linear-gradient(135deg, ${difficultyColors.bg} 0%, ${difficultyColors.border} 100%)`,
                      border: isCompleted
                        ? '3px solid #22c55e'
                        : `3px solid ${difficultyColors.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      boxShadow: isCompleted
                        ? '0 0 20px rgba(74, 222, 128, 0.4), 4px 4px 0px #333'
                        : `0 0 20px ${difficultyColors.glow}, 4px 4px 0px #333`,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = isCompleted
                        ? '0 0 25px rgba(74, 222, 128, 0.6), 6px 6px 0px #333'
                        : `0 0 25px ${difficultyColors.glow}, 6px 6px 0px #333`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isCompleted
                        ? '0 0 20px rgba(74, 222, 128, 0.4), 4px 4px 0px #333'
                        : `0 0 20px ${difficultyColors.glow}, 4px 4px 0px #333`;
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

