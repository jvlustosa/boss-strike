import { useState, useEffect } from 'react';
import { shouldUsePlayroom } from '../game/core/environmentDetector';

interface PixelatedFireButtonProps {
  onFire: () => void;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export function PixelatedFireButton({ onFire, position = 'bottom-right' }: PixelatedFireButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Only render on mobile/touch devices
  useEffect(() => {
    setShouldRender(shouldUsePlayroom());
  }, []);

  if (!shouldRender) {
    return null;
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
      width: '80px',
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Pixelify Sans', monospace",
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#fff',
      textShadow: '3px 3px 0px #000',
      border: '4px solid #000',
      borderRadius: '12px',
      cursor: 'pointer',
      userSelect: 'none' as const,
      transition: 'all 0.1s ease',
      background: isPressed 
        ? 'linear-gradient(135deg, #2E7D32, #1B5E20)' 
        : 'linear-gradient(135deg, #4CAF50, #2E7D32)',
      boxShadow: isPressed
        ? 'inset 0 0 0 3px #000, 0 3px 0 #000'
        : '0 6px 0 #000, 0 0 0 3px #000',
      transform: isPressed ? 'translateY(3px)' : 'translateY(0)',
      imageRendering: 'pixelated' as const,
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyles, bottom: '30px', left: '30px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '30px', right: '30px' };
      case 'top-left':
        return { ...baseStyles, top: '30px', left: '30px' };
      case 'top-right':
        return { ...baseStyles, top: '30px', right: '30px' };
      default:
        return { ...baseStyles, bottom: '30px', right: '30px' };
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPressed(true);
    onFire();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPressed(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPressed(true);
    onFire();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  return (
    <div
      style={getPositionStyles()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      FIRE
    </div>
  );
}
