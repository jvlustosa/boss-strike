import { useState, useEffect } from 'react';
import { isMobile } from '../game/core/environmentDetector';

interface MobileCreditsProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'top-center';
}

export function MobileCredits({ 
  visible = true, 
  position = 'top-left' 
}: MobileCreditsProps) {
  const [shouldRender, setShouldRender] = useState(false);

  // Only render on mobile devices
  useEffect(() => {
    setShouldRender(isMobile());
  }, []);

  if (!shouldRender || !visible) {
    return null;
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
      fontFamily: "'Pixelify Sans', monospace",
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#fff',
      textShadow: '2px 2px 0px #000, 1px 1px 0px #333',
      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
      padding: '4px 8px',
      borderRadius: '6px',
      border: '1px solid #555',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
      pointerEvents: 'none' as const,
      userSelect: 'none' as const,
      animation: 'fadeInCredits 2s ease-in-out',
      opacity: 0.9,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '45px', left: '15px' }; // Below level title (15px + ~30px for level title)
      case 'top-right':
        return { ...baseStyles, top: '15px', right: '15px' };
      case 'top-center':
        return { 
          ...baseStyles, 
          top: '45px', // Below level title
          left: '50%', 
          transform: 'translateX(-50%)' 
        };
      default:
        return { ...baseStyles, top: '45px', left: '15px' }; // Below level title
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInCredits {
            0% { 
              opacity: 0; 
              transform: translateY(-5px); 
            }
            100% { 
              opacity: 0.9; 
              transform: translateY(0); 
            }
          }
        `}
      </style>
      <div style={getPositionStyles()}>
        by Duspace
      </div>
    </>
  );
}
