import { useEffect, useRef } from 'react';

interface PixelBlock {
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  direction: number;
  life: number;
  maxLife: number;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blocksRef = useRef<PixelBlock[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize blocks
    const initBlocks = () => {
      blocksRef.current = [];
      const blockCount = Math.floor((canvas.width * canvas.height) / 8000); // Density based on screen size
      
      for (let i = 0; i < blockCount; i++) {
        blocksRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 4 + Math.random() * 8,
          color: getRandomRetroColor(),
          speed: 0.5 + Math.random() * 2,
          direction: Math.random() * Math.PI * 2,
          life: Math.random() * 100,
          maxLife: 100 + Math.random() * 200,
        });
      }
    };

    const getRandomRetroColor = (): string => {
      const colors = [
        '#1a1a2e', // Dark blue
        '#16213e', // Darker blue
        '#0f3460', // Blue
        '#533483', // Purple
        '#7209b7', // Bright purple
        '#a663cc', // Light purple
        '#2d1b69', // Dark purple
        '#11998e', // Teal
        '#38ef7d', // Green
        '#f093fb', // Pink
        '#f5576c', // Red
        '#4facfe', // Light blue
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const updateBlocks = () => {
      blocksRef.current.forEach((block) => {
        // Move block
        block.x += Math.cos(block.direction) * block.speed;
        block.y += Math.sin(block.direction) * block.speed;

        // Update life
        block.life += 1;

        // Wrap around screen
        if (block.x < -block.size) block.x = canvas.width + block.size;
        if (block.x > canvas.width + block.size) block.x = -block.size;
        if (block.y < -block.size) block.y = canvas.height + block.size;
        if (block.y > canvas.height + block.size) block.y = -block.size;

        // Occasionally change direction
        if (Math.random() < 0.01) {
          block.direction = Math.random() * Math.PI * 2;
        }

        // Occasionally change color
        if (Math.random() < 0.005) {
          block.color = getRandomRetroColor();
        }

        // Reset block if it's lived too long
        if (block.life > block.maxLife) {
          block.x = Math.random() * canvas.width;
          block.y = Math.random() * canvas.height;
          block.color = getRandomRetroColor();
          block.life = 0;
          block.maxLife = 100 + Math.random() * 200;
        }
      });
    };

    const renderBlocks = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      blocksRef.current.forEach((block) => {
        const alpha = Math.min(1, (block.life / 50) * 0.15 + 0.05); // Reduced opacity - fade in effect
        
        ctx.fillStyle = block.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(
          Math.floor(block.x - block.size / 2),
          Math.floor(block.y - block.size / 2),
          Math.floor(block.size),
          Math.floor(block.size)
        );

        // Add subtle glow effect with reduced opacity
        if (block.size > 6) {
          ctx.fillStyle = block.color + '10'; // Reduced glow opacity
          ctx.fillRect(
            Math.floor(block.x - block.size / 2 - 1),
            Math.floor(block.y - block.size / 2 - 1),
            Math.floor(block.size + 2),
            Math.floor(block.size + 2)
          );
        }
      });
    };

    const animate = () => {
      updateBlocks();
      renderBlocks();
      animationRef.current = requestAnimationFrame(animate);
    };

    initBlocks();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        imageRendering: 'pixelated',
        imageRendering: '-moz-crisp-edges',
        imageRendering: 'crisp-edges',
      }}
    />
  );
}
