import { useEffect, useState, useRef } from 'react';
import { PIXEL_FONT } from '../utils/fonts';
import type { Skin } from '../utils/supabase-structure';

interface SkinUnlockAnimationProps {
  skin: Skin;
  onComplete: () => void;
}

export function SkinUnlockAnimation({ skin, onComplete }: SkinUnlockAnimationProps) {
  const [phase, setPhase] = useState<'box' | 'cracking' | 'reveal' | 'complete'>('box');
  const [crackProgress, setCrackProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(Date.now());

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'rare': return '#3b82f6';
      case 'epic': return '#a855f7';
      case 'legendary': return '#f59e0b';
      case 'mythic': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const boxSize = 120;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const boxX = centerX - boxSize / 2;
    const boxY = centerY - boxSize / 2 - 20;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = (Date.now() - startTimeRef.current) / 1000;

      if (phase === 'box') {
        // Draw closed box with glow
        const glowIntensity = 0.5 + Math.sin(time * 2) * 0.3;
        ctx.shadowBlur = 20 * glowIntensity;
        ctx.shadowColor = getRarityColor(skin.rarity);
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(boxX, boxY, boxSize, boxSize);
        ctx.shadowBlur = 0;

        // Box border
        ctx.strokeStyle = getRarityColor(skin.rarity);
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxSize, boxSize);

        // Question mark
        ctx.fillStyle = getRarityColor(skin.rarity);
        ctx.font = `bold 48px ${PIXEL_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', centerX, centerY);
      } else if (phase === 'cracking') {
        // Draw box with cracks
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(boxX, boxY, boxSize, boxSize);

        ctx.strokeStyle = getRarityColor(skin.rarity);
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxSize, boxSize);

        // Draw cracks
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const crackCount = Math.floor(crackProgress * 8);
        for (let i = 0; i < crackCount; i++) {
          const startX = boxX + Math.random() * boxSize;
          const startY = boxY + Math.random() * boxSize;
          const endX = startX + (Math.random() - 0.5) * 40;
          const endY = startY + (Math.random() - 0.5) * 40;
          
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
        }
        ctx.stroke();

        // Shake effect
        const shake = Math.sin(time * 30) * (1 - crackProgress) * 3;
        ctx.save();
        ctx.translate(shake, shake);
        ctx.restore();
      } else if (phase === 'reveal') {
        // Draw broken box pieces
        const pieces = 4;
        const pieceSize = boxSize / 2;
        
        for (let i = 0; i < pieces; i++) {
          const px = boxX + (i % 2) * pieceSize;
          const py = boxY + Math.floor(i / 2) * pieceSize;
          const offset = (time - 0.5) * 50;
          const angle = (i * Math.PI / 2) + time;
          
          ctx.save();
          ctx.translate(px + pieceSize / 2, py + pieceSize / 2);
          ctx.rotate(angle);
          ctx.translate(-pieceSize / 2, -pieceSize / 2);
          
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, pieceSize, pieceSize);
          ctx.strokeStyle = getRarityColor(skin.rarity);
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, pieceSize, pieceSize);
          
          ctx.restore();
        }

        // Draw particles
        particles.forEach((p, i) => {
          ctx.fillStyle = getRarityColor(skin.rarity);
          ctx.globalAlpha = p.life;
          ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
          ctx.globalAlpha = 1;
        });
      } else if (phase === 'complete') {
        // Draw skin name with glow
        ctx.shadowBlur = 30;
        ctx.shadowColor = getRarityColor(skin.rarity);
        ctx.fillStyle = getRarityColor(skin.rarity);
        ctx.font = `bold 24px ${PIXEL_FONT}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(skin.display_name, centerX, centerY - 20);
        
        ctx.font = `16px ${PIXEL_FONT}`;
        ctx.fillStyle = '#fff';
        ctx.fillText('DESBLOQUEADO!', centerX, centerY + 20);
        ctx.shadowBlur = 0;
      }
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [phase, crackProgress, particles, skin]);

  useEffect(() => {
    // Phase 1: Show box (0.5s)
    const timer1 = setTimeout(() => {
      setPhase('cracking');
    }, 500);

    // Phase 2: Cracking animation (0.8s)
    const timer2 = setTimeout(() => {
      const crackInterval = setInterval(() => {
        setCrackProgress((prev) => {
          if (prev >= 1) {
            clearInterval(crackInterval);
            return 1;
          }
          return prev + 0.1;
        });
      }, 80);

      setTimeout(() => {
        clearInterval(crackInterval);
        setPhase('reveal');
        
        // Create particles
        const newParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = [];
        for (let i = 0; i < 20; i++) {
          newParticles.push({
            x: canvasRef.current!.width / 2,
            y: canvasRef.current!.height / 2,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 1,
          });
        }
        setParticles(newParticles);
      }, 800);
    }, 500);

    // Phase 3: Reveal (1s)
    const timer3 = setTimeout(() => {
      setPhase('complete');
    }, 1800);

    // Phase 4: Complete (1.5s then close)
    const timer4 = setTimeout(() => {
      onComplete();
    }, 3300);

    // Update particles
    const particleInterval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.016,
            y: p.y + p.vy * 0.016,
            life: Math.max(0, p.life - 0.02),
          }))
          .filter((p) => p.life > 0)
      );
    }, 16);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearInterval(particleInterval);
    };
  }, [onComplete]);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        fontFamily: PIXEL_FONT,
      }}
    >
      <canvas
        ref={canvasRef}
        width={isMobile ? 300 : 400}
        height={isMobile ? 300 : 400}
        style={{
          imageRendering: 'pixelated' as any,
        }}
      />
    </div>
  );
}

