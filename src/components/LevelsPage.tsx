import React, { useState, useEffect, useRef } from 'react';
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
  const [comets, setComets] = useState<Array<{ id: number; startX: number; startY: number; angle: number; speed: number; size: number }>>([]);
  const maxLevel = getMaxLevel();
  const mobile = isMobile();
  const levelRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const cometCountRef = useRef(0);

  useEffect(() => {
    const loadUnlockedLevel = async () => {
      const progress = await loadProgress();
      if (progress) {
        // Nível desbloqueado é o progresso atual + 1 (para poder jogar o próximo nível)
        const nextUnlocked = Math.max(1, progress.level + 1);
        setUnlockedLevel(nextUnlocked);
        
        // Auto-scroll to the unlocked level after a short delay
        setTimeout(() => {
          const targetLevel = Math.min(nextUnlocked, maxLevel);
          const levelElement = levelRefs.current[targetLevel];
          if (levelElement) {
            levelElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
            });
          }
        }, 300);
      } else {
        // Se não há progresso, apenas nível 1 está desbloqueado
        setUnlockedLevel(1);
      }
    };
    loadUnlockedLevel();
  }, [maxLevel]);

  // Comet spawner - max 2 per minute
  useEffect(() => {
    const spawnComet = () => {
      // Check if we can spawn a comet (max 2 per minute)
      if (cometCountRef.current >= 2) {
        return;
      }

      // Random chance to spawn (30% when called)
      if (Math.random() > 0.30) {
        return;
      }

      cometCountRef.current += 1;

      const id = Date.now();
      
      // Random direction: 0=left-to-right, 1=right-to-left, 2=top-to-bottom, 3=bottom-to-top
      // 4=diagonal topleft-bottomright, 5=diagonal topright-bottomleft
      const direction = Math.floor(Math.random() * 6);
      let startX, startY, angle;
      
      switch (direction) {
        case 0: // Left to right (horizontal)
          startX = -100;
          startY = Math.random() * window.innerHeight;
          angle = Math.random() * 20 - 10; // -10° to 10° (mostly horizontal)
          break;
        case 1: // Right to left (horizontal)
          startX = window.innerWidth + 100;
          startY = Math.random() * window.innerHeight;
          angle = 180 + (Math.random() * 20 - 10); // 170° to 190°
          break;
        case 2: // Top to bottom (vertical)
          startX = Math.random() * window.innerWidth;
          startY = -100;
          angle = 90 + (Math.random() * 20 - 10); // 80° to 100°
          break;
        case 3: // Bottom to top (vertical)
          startX = Math.random() * window.innerWidth;
          startY = window.innerHeight + 100;
          angle = 270 + (Math.random() * 20 - 10); // 260° to 280°
          break;
        case 4: // Diagonal: top-left to bottom-right
          startX = -100;
          startY = -100;
          angle = 45 + (Math.random() * 30 - 15); // 30° to 60°
          break;
        default: // Diagonal: top-right to bottom-left
          startX = window.innerWidth + 100;
          startY = -100;
          angle = 135 + (Math.random() * 30 - 15); // 120° to 150°
          break;
      }
      
      const speed = 6 + Math.random() * 4; // 6-10 seconds (slower for full crossing)
      const size = 1.5 + Math.random() * 2.5; // 1.5-4px

      setComets(prev => [...prev, { id, startX, startY, angle, speed, size }]);

      // Remove comet after animation
      setTimeout(() => {
        setComets(prev => prev.filter(c => c.id !== id));
      }, speed * 1000);
    };

    // Check for comet spawn every 12-18 seconds
    const interval = setInterval(() => {
      spawnComet();
    }, 12000 + Math.random() * 6000);

    // Reset counter every minute
    const resetInterval = setInterval(() => {
      cometCountRef.current = 0;
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(resetInterval);
    };
  }, []);

  // Gerar estrelas pixeladas esparsas
  useEffect(() => {
    const starCount = mobile ? 20 : 50;
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

  const handleStartLevel = (level?: number) => {
    const levelToStart = level || selectedLevel;
    if (levelToStart) {
      onStartGame(levelToStart);
      navigate('/');
    }
  };

  const handleCloseModal = () => {
    setSelectedLevel(null);
  };

  const handleQuickPlay = (level: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (level <= unlockedLevel) {
      handleStartLevel(level);
    }
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
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(180deg, #000000 0%, #050510 50%, #000000 100%)',
    padding: mobile ? '15px 5px' : '40px 20px',
    paddingTop: mobile ? '55px' : '80px',
    paddingBottom: mobile ? '80px' : '120px',
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
    WebkitOverflowScrolling: 'touch',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: mobile ? '20px' : '32px',
    marginBottom: mobile ? '15px' : '30px',
    textAlign: 'center',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
  };

  const roadmapStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: mobile ? '30px' : '50px',
    width: '100%',
    maxWidth: mobile ? '100%' : '600px',
    position: 'relative',
    paddingBottom: mobile ? '40px' : '80px',
    overflow: 'visible',
  };

  const getPathSVG = () => {
    const nodeSize = mobile ? 50 : 80;
    const nodeSpacing = mobile ? 130 : 180;
    const offset = mobile ? 45 : 60;
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
    const completed = isCompleted(level);
    const isCurrentLevel = level === unlockedLevel && level <= maxLevel;
    const difficulty = getDifficulty(level);
    const difficultyColors = getDifficultyColor(difficulty);

    const circleSize = mobile ? '50px' : '80px';
    const fontSize = mobile ? '18px' : '28px';
    const borderWidth = mobile ? '2px' : '3px';

    if (locked) {
      return {
        width: circleSize,
        height: circleSize,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize,
        fontWeight: 'bold',
        border: `${borderWidth} solid #444`,
        background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
        boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.05), 4px 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        position: 'relative',
        zIndex: 3,
      };
    }

    if (hovered) {
      return {
        width: circleSize,
        height: circleSize,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize,
        fontWeight: 'bold',
        border: completed ? `${borderWidth} solid #4ade80` : `${borderWidth} solid #888`,
        background: completed
          ? 'linear-gradient(145deg, #22c55e 0%, #16a34a 50%, #15803d 100%)'
          : 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)',
        boxShadow: completed 
          ? 'inset 2px 2px 4px rgba(255, 255, 255, 0.2), inset -2px -2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(74, 222, 128, 0.4), 4px 4px 8px rgba(0, 0, 0, 0.3)'
          : 'inset 2px 2px 4px rgba(255, 255, 255, 0.1), inset -2px -2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(136, 136, 136, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        transform: 'scale(1.15)',
        position: 'relative',
        zIndex: 3,
      };
    }

    // Current level style (gray with dashed trophy)
    if (isCurrentLevel) {
      return {
        width: circleSize,
        height: circleSize,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize,
        fontWeight: 'bold',
        border: `${borderWidth} solid #888`,
        background: 'linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)',
        boxShadow: 'inset 2px 2px 4px rgba(255, 255, 255, 0.1), inset -2px -2px 4px rgba(0, 0, 0, 0.3), 0 0 8px rgba(136, 136, 136, 0.3), 4px 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        position: 'relative',
        zIndex: 3,
        animation: 'levelPulse 2s ease-in-out infinite',
      };
    }

    // Completed levels (green with solid trophy)
    if (completed) {
      return {
        width: circleSize,
        height: circleSize,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: fontSize,
        fontWeight: 'bold',
        border: `${borderWidth} solid #4ade80`,
        background: 'linear-gradient(145deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
        boxShadow: 'inset 2px 2px 4px rgba(255, 255, 255, 0.2), inset -2px -2px 4px rgba(0, 0, 0, 0.3), 0 0 10px rgba(74, 222, 128, 0.4), 4px 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        position: 'relative',
        zIndex: 3,
      };
    }

    // Should not reach here, but fallback
    return {
      width: circleSize,
      height: circleSize,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: fontSize,
      fontWeight: 'bold',
      border: `${borderWidth} solid #666`,
      background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
      boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.5), inset -2px -2px 4px rgba(255, 255, 255, 0.05), 4px 4px 8px rgba(0, 0, 0, 0.3)',
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
      fontSize: mobile ? '13px' : '20px',
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
    const jupiterMax = mobile ? 100 : 170;
    const marsBase = Math.max(30, Math.round(jupiterMax * (0.53 / 11.2)));
    const size = marsBase;
    const nodeSpacing = mobile ? 130 : 180;
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
    const jupiterMax = mobile ? 100 : 170;
    const saturnBase = Math.round(jupiterMax * (9.4 / 11.2));
    const size = saturnBase;
    const ringSize = Math.round(size * 1.4); // Anéis 40% maiores que o planeta
    const nodeSpacing = mobile ? 130 : 180;
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
    const jupiterMax = mobile ? 100 : 170;
    const size = jupiterMax;
    const nodeSpacing = mobile ? 130 : 180;
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
    const jupiterMax = mobile ? 100 : 170;
    const neptuneBase = Math.round(jupiterMax * (3.9 / 11.2));
    const size = neptuneBase;
    const nodeSpacing = mobile ? 130 : 180;
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
    const sunSize = mobile ? 70 : 120;
    const glowSize = mobile ? 300 : 500;
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
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: mobile ? '200px' : '300px',
          height: mobile ? '200px' : '300px',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.3,
        }}
      >
        {/* Núcleo simples */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: mobile ? '60px' : '80px',
            height: mobile ? '60px' : '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 255, 200, 0.3) 0%, rgba(200, 180, 255, 0.2) 50%, transparent 100%)',
            filter: 'blur(3px)',
          }}
        />
      </div>
    );
  };

  const lockIconStyle: React.CSSProperties = {
    fontSize: mobile ? '24px' : '32px',
    color: '#666',
  };

  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  const nodeSize = mobile ? 50 : 80;
  const nodeSpacing = mobile ? 130 : 180;
  const pathWidth = mobile ? 8 : 14;
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
        {/* Background layer para cometas */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -2,
          pointerEvents: 'none',
        }}>
          {/* Cometas passando no fundo do universo */}
          {comets.map((comet) => {
            // Calculate travel distance - use screen diagonal x 1.5 to ensure full crossing
            const distance = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2) * 1.5;
            // Calculate end position based on angle
            const radians = (comet.angle * Math.PI) / 180;
            const endX = Math.cos(radians) * distance;
            const endY = Math.sin(radians) * distance;
            
            return (
              <div
                key={comet.id}
                style={{
                  position: 'absolute',
                  left: `${comet.startX}px`,
                  top: `${comet.startY}px`,
                  width: `${mobile ? 80 : 120}px`,
                  height: `${comet.size}px`,
                  pointerEvents: 'none',
                  animation: `cometFly-${comet.id} ${comet.speed}s linear forwards`,
                }}
              >
                {/* Cauda do cometa */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(to right, transparent, rgba(135, 206, 250, 0.25), rgba(173, 216, 230, 0.5), rgba(255, 255, 255, 0.8))`,
                    borderRadius: '50%',
                    filter: 'blur(2px)',
                  }}
                />
                {/* Núcleo brilhante do cometa */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: `${comet.size * 3}px`,
                    height: `${comet.size * 3}px`,
                    background: 'radial-gradient(circle, #fff 0%, rgba(135, 206, 250, 0.95) 40%, rgba(100, 180, 230, 0.7) 70%, transparent 100%)',
                    borderRadius: '50%',
                    boxShadow: `0 0 ${comet.size * 5}px rgba(135, 206, 250, 0.9), 0 0 ${comet.size * 8}px rgba(135, 206, 250, 0.5), 0 0 ${comet.size * 12}px rgba(135, 206, 250, 0.3)`,
                  }}
                />
                <style>{`
                  @keyframes cometFly-${comet.id} {
                    0% {
                      transform: translate(0, 0) rotate(${comet.angle}deg);
                      opacity: 0;
                    }
                    5% {
                      opacity: 0.8;
                    }
                    15% {
                      opacity: 1;
                    }
                    85% {
                      opacity: 1;
                    }
                    95% {
                      opacity: 0.8;
                    }
                    100% {
                      transform: translate(${endX}px, ${endY}px) rotate(${comet.angle}deg);
                      opacity: 0;
                    }
                  }
                `}</style>
              </div>
            );
          })}
        </div>

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
            @keyframes levelPulse {
              0%, 100% {
                box-shadow: 
                  inset 2px 2px 4px rgba(255, 255, 255, 0.1), 
                  inset -2px -2px 4px rgba(0, 0, 0, 0.3), 
                  0 0 8px rgba(136, 136, 136, 0.5), 
                  4px 4px 8px rgba(0, 0, 0, 0.3);
                transform: scale(1);
              }
              50% {
                box-shadow: 
                  inset 2px 2px 4px rgba(255, 255, 255, 0.15), 
                  inset -2px -2px 4px rgba(0, 0, 0, 0.4), 
                  0 0 15px rgba(136, 136, 136, 0.8), 
                  0 0 25px rgba(136, 136, 136, 0.4),
                  4px 4px 8px rgba(0, 0, 0, 0.3);
                transform: scale(1.03);
              }
            }
            @keyframes newBadgePulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 0 10px rgba(251, 191, 36, 0.6), 2px 2px 0px #333;
              }
              50% {
                transform: scale(1.1);
                box-shadow: 0 0 15px rgba(251, 191, 36, 0.9), 2px 2px 0px #333;
              }
            }
            @keyframes particleFlow0 {
              0% {
                transform: translate(0, 0);
              }
              25% {
                transform: translate(5px, 25px);
              }
              50% {
                transform: translate(-3px, 50px);
              }
              75% {
                transform: translate(7px, 75px);
              }
              100% {
                transform: translate(0, 100px);
                opacity: 0;
              }
            }
            @keyframes particleFlow1 {
              0% {
                transform: translate(0, 0);
              }
              20% {
                transform: translate(-7px, 20px);
              }
              40% {
                transform: translate(4px, 40px);
              }
              60% {
                transform: translate(-5px, 60px);
              }
              80% {
                transform: translate(6px, 80px);
              }
              100% {
                transform: translate(0, 100px);
                opacity: 0;
              }
            }
            @keyframes particleFlow2 {
              0% {
                transform: translate(0, 0);
              }
              30% {
                transform: translate(6px, 30px);
              }
              50% {
                transform: translate(-4px, 50px);
              }
              70% {
                transform: translate(8px, 70px);
              }
              90% {
                transform: translate(-2px, 90px);
              }
              100% {
                transform: translate(0, 100px);
                opacity: 0;
              }
            }
            @keyframes flareShine {
              0% {
                filter: brightness(1) drop-shadow(0 0 4px #6b8fff);
              }
              50% {
                filter: brightness(1.6) drop-shadow(0 0 12px #8ba5ff) drop-shadow(0 0 20px #4b70dd);
              }
              100% {
                filter: brightness(1) drop-shadow(0 0 4px #6b8fff);
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
            
        {/* Trilha de poeira cósmica com partículas pixeladas */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: `${maxLevel * nodeSpacing}px`,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}>
          {/* Partículas de poeira cósmica pixeladas com movimento */}
          {Array.from({ length: mobile ? 25 : 60 }, (_, i) => {
            const levelIndex = Math.floor((i / (mobile ? 25 : 60)) * maxLevel);
            const baseY = levelIndex * nodeSpacing;
            const spreadX = (i % 7) * (mobile ? 12 : 15) - (mobile ? 36 : 45); // Spread horizontal
            const spreadY = (i % 5) * (mobile ? 25 : 30) - (mobile ? 50 : 60); // Spread vertical
            const randomX = centerX + spreadX;
            const randomY = baseY + spreadY;
            
            // Alternância entre branco e tons de azul
            const colors = ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9'];
            const color = colors[i % colors.length];
            
            const size = mobile ? (i % 3 === 0 ? 2.5 : 2) : (i % 3 === 0 ? 4 : 3);
            
            // Movimento variado para cada partícula
            const flowDuration = 8 + (i % 5) * 2; // 8-16 segundos
            
            return (
              <React.Fragment key={`particle-${i}`}>
                {/* Thin blue transparent trace */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${randomX}px`,
                    top: `${randomY}px`,
                    width: `${size * 0.4}px`,
                    height: `${size * 5}px`,
                    background: 'linear-gradient(to bottom, transparent, #60a5fa30, transparent)',
                    imageRendering: 'pixelated' as any,
                    opacity: 0.5,
                    animation: `particleFlow${i % 3} ${flowDuration}s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                    transform: 'translateY(-10px)',
                  } as React.CSSProperties}
                />
                
                {/* Bright particle */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${randomX}px`,
                    top: `${randomY}px`,
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: color,
                    imageRendering: 'pixelated' as any,
                    boxShadow: `
                      0 0 ${size * 3}px ${color},
                      0 0 ${size * 6}px ${color}80,
                      0 0 ${size * 9}px ${color}40
                    `,
                    opacity: 0.95,
                    animation: `particleFlow${i % 3} ${flowDuration}s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                    filter: 'brightness(1.4)',
                  } as React.CSSProperties}
                />
              </React.Fragment>
            );
          })}
          
          {/* Linha central sutil */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          >
            <defs>
              <linearGradient id="cometTrail" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#1e40af" stopOpacity="0.2" />
              </linearGradient>
              
              {/* Gradiente azul cósmico de Netuno para progresso */}
              <linearGradient id="progressNeon" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4b70dd" stopOpacity="0.95" />
                <stop offset="30%" stopColor="#4166d1" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#2d4a9e" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.8" />
              </linearGradient>
              
              {/* Glow effect para neon cósmico */}
              <filter id="neonGlow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              {/* Glow extra para efeito Netuno */}
              <filter id="neptuneGlow">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
                <feColorMatrix type="saturate" values="1.5" />
              </filter>
              
              {/* Gradiente para flares animados */}
              <linearGradient id="flareGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4b70dd" stopOpacity="0">
                  <animate attributeName="stop-opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="30%" stopColor="#6b8fff" stopOpacity="0">
                  <animate attributeName="stop-opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#8ba5ff" stopOpacity="0">
                  <animate attributeName="stop-opacity" values="0;0.9;0" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="70%" stopColor="#6b8fff" stopOpacity="0">
                  <animate attributeName="stop-opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#4b70dd" stopOpacity="0">
                  <animate attributeName="stop-opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
            
            {/* Trilha vertical reta (base) - sempre visível */}
            {/* Camada de fundo sutil */}
            <line
              x1={centerX}
              y1={0}
              x2={centerX}
              y2={maxLevel * nodeSpacing}
              stroke="#2563eb"
              strokeWidth={pathWidth * 1.2}
              strokeLinecap="round"
              opacity={0.15}
              filter="blur(2px)"
            />
            {/* Camada principal da linha base */}
            <line
              x1={centerX}
              y1={0}
              x2={centerX}
              y2={maxLevel * nodeSpacing}
              stroke="url(#cometTrail)"
              strokeWidth={pathWidth * 0.8}
              strokeLinecap="round"
              opacity={0.5}
            />
            
            {/* Progresso preenchido - Azul cósmico de Netuno até fase completada */}
            {unlockedLevel > 1 && (() => {
              // Calcular o progresso até a última fase completada
              const completedLevel = unlockedLevel - 1; // Última fase completada
              const progressHeight = completedLevel * nodeSpacing + nodeSpacing / 2;
              
              return (
                <>
                  {/* Camada base do glow cósmico */}
                  <line
                    x1={centerX}
                    y1={0}
                    x2={centerX}
                    y2={progressHeight}
                    stroke="#4b70dd"
                    strokeWidth={pathWidth * 2.5}
                    strokeLinecap="round"
                    opacity={0.2}
                    filter="url(#neptuneGlow)"
                  />
                  
                  {/* Glow médio azul cósmico */}
                  <line
                    x1={centerX}
                    y1={0}
                    x2={centerX}
                    y2={progressHeight}
                    stroke="#4166d1"
                    strokeWidth={pathWidth * 1.5}
                    strokeLinecap="round"
                    opacity={0.4}
                    style={{
                      filter: 'blur(4px)',
                    }}
                  />
                  
                  {/* Trilha de progresso principal com efeito neon cósmico */}
                  <line
                    x1={centerX}
                    y1={0}
                    x2={centerX}
                    y2={progressHeight}
                    stroke="url(#progressNeon)"
                    strokeWidth={pathWidth * 0.9}
                    strokeLinecap="round"
                    opacity={0.95}
                    filter="url(#neonGlow)"
                  />
                  
                  {/* Flares animados descendo pela barra */}
                  <line
                    x1={centerX}
                    y1={0}
                    x2={centerX}
                    y2={progressHeight}
                    stroke="url(#flareGradient)"
                    strokeWidth={pathWidth * 1.2}
                    strokeLinecap="round"
                    opacity={0.8}
                    filter="url(#neonGlow)"
                  >
                    <animate
                      attributeName="y1"
                      values={`0;${progressHeight};${progressHeight}`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y2"
                      values={`0;${progressHeight};${progressHeight}`}
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </line>
                  
                  {/* Segundo flare (delay) */}
                  <line
                    x1={centerX}
                    y1={0}
                    x2={centerX}
                    y2={progressHeight}
                    stroke="url(#flareGradient)"
                    strokeWidth={pathWidth * 0.8}
                    strokeLinecap="round"
                    opacity={0.6}
                    filter="url(#neonGlow)"
                  >
                    <animate
                      attributeName="y1"
                      values={`0;${progressHeight};${progressHeight}`}
                      dur="3s"
                      begin="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="y2"
                      values={`0;${progressHeight};${progressHeight}`}
                      dur="3s"
                      begin="1.5s"
                      repeatCount="indefinite"
                    />
                  </line>
                  
                  {/* Partículas brilhantes descendo */}
                  {[...Array(3)].map((_, i) => (
                    <circle
                      key={`flare-particle-${i}`}
                      cx={centerX}
                      cy={0}
                      r={pathWidth * 0.4}
                      fill="#8ba5ff"
                      opacity={0.9}
                      filter="url(#neonGlow)"
                    >
                      <animate
                        attributeName="cy"
                        values={`0;${progressHeight}`}
                        dur="2.5s"
                        begin={`${i * 0.8}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0;0.9;0.9;0"
                        dur="2.5s"
                        begin={`${i * 0.8}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  ))}
                </>
              );
            })()}
          </svg>
          
          {/* Flares HTML com brilho intenso */}
          {unlockedLevel > 1 && (() => {
            const completedLevel = unlockedLevel - 1;
            const progressHeight = completedLevel * nodeSpacing + nodeSpacing / 2;
            
            return (
              <>
                <style>{`
                  @keyframes flareDescend0 {
                    0% {
                      transform: translateX(-50%) translateY(0);
                      opacity: 0;
                    }
                    10% {
                      opacity: 1;
                    }
                    90% {
                      opacity: 1;
                    }
                    100% {
                      transform: translateX(-50%) translateY(${progressHeight}px);
                      opacity: 0;
                    }
                  }
                  @keyframes flareDescend1 {
                    0% {
                      transform: translateX(-50%) translateY(0);
                      opacity: 0;
                    }
                    10% {
                      opacity: 0.8;
                    }
                    90% {
                      opacity: 0.8;
                    }
                    100% {
                      transform: translateX(-50%) translateY(${progressHeight}px);
                      opacity: 0;
                    }
                  }
                `}</style>
                {[...Array(2)].map((_, i) => (
                  <div
                    key={`html-flare-${i}`}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      width: mobile ? '4px' : '6px',
                      height: mobile ? '40px' : '60px',
                      background: 'linear-gradient(to bottom, transparent, #8ba5ff, #6b8fff, #8ba5ff, transparent)',
                      transform: 'translateX(-50%)',
                      animation: `flareShine 1.5s ease-in-out infinite, flareDescend${i} ${3 + i}s linear infinite`,
                      animationDelay: `${i * 1.5}s`,
                      borderRadius: '50%',
                      filter: 'blur(3px)',
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}
                  />
                ))}
              </>
            );
          })()}
        </div>
        
        {levels.map((level) => {
          const config = getLevelConfig(level);
          const unlocked = isUnlocked(level);
          const locked = isLocked(level);
          const isLeftSide = level % 2 !== 0;

          return (
            <div
              key={level}
              ref={(el) => (levelRefs.current[level] = el)}
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
                  {locked ? '🔒' : level === unlockedLevel && level <= maxLevel ? (
                    // Dashed trophy outline for current level
                    <svg 
                      width={mobile ? "22" : "36"} 
                      height={mobile ? "22" : "36"} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="#888" 
                      strokeWidth="2"
                      strokeDasharray="3,2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 0 2px rgba(136, 136, 136, 0.5))' }}
                    >
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                      <path d="M4 22h16" />
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                    </svg>
                  ) : isCompleted(level) ? '🏆' : level}
                </div>
                
                {/* NEW Badge for Current Unlocked Level */}
                {level === unlockedLevel && level <= maxLevel && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: isLeftSide ? 'auto' : '-10px',
                    left: isLeftSide ? '-10px' : 'auto',
                    padding: mobile ? '2px 6px' : '3px 8px',
                    fontSize: mobile ? '8px' : '10px',
                    fontFamily: PIXEL_FONT,
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: '#000',
                    border: '2px solid #f59e0b',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 0 10px rgba(251, 191, 36, 0.6), 2px 2px 0px #333',
                    zIndex: 11,
                    animation: 'newBadgePulse 1.5s ease-in-out infinite',
                  }}>
                    NEW!
                  </div>
                )}
                
                {/* Quick Play Button */}
                {unlocked && (() => {
                  const isCurrentBtn = level === unlockedLevel && level <= maxLevel;
                  const btnBg = isCurrentBtn 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
                  const btnBorder = isCurrentBtn ? '#6b7280' : '#22c55e';
                  const btnShadow = isCurrentBtn 
                    ? '0 0 10px rgba(156, 163, 175, 0.4), 2px 2px 0px #333'
                    : '0 0 10px rgba(74, 222, 128, 0.4), 2px 2px 0px #333';
                  const btnShadowHover = isCurrentBtn
                    ? '0 0 15px rgba(156, 163, 175, 0.6), 3px 3px 0px #333'
                    : '0 0 15px rgba(74, 222, 128, 0.6), 3px 3px 0px #333';
                  
                  return (
                    <button
                      onClick={(e) => handleQuickPlay(level, e)}
                      style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: mobile ? '4px 10px' : '6px 14px',
                        fontSize: mobile ? '10px' : '12px',
                        fontFamily: PIXEL_FONT,
                        fontWeight: 'bold',
                        background: btnBg,
                        color: '#000',
                        border: `2px solid ${btnBorder}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        boxShadow: btnShadow,
                        transition: 'all 0.2s ease',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px) scale(1.05)';
                        e.currentTarget.style.boxShadow = btnShadowHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(-50%)';
                        e.currentTarget.style.boxShadow = btnShadow;
                      }}
                    >
                      ▶ Play
                    </button>
                  );
                })()}
                
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

