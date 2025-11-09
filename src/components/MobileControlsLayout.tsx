import { useState, useEffect } from 'react';
import { NativeJoystick } from './NativeJoystick';
import { PixelatedFireButton } from './PixelatedFireButton';
import { emitSubtleLog } from './SubtleLogger';
import { isMobile } from '../game/core/environmentDetector';
import { isJoystickDisabled } from '../game/core/urlParams';

interface MobileControlsLayoutProps {
  onFire: () => void;
}

export function MobileControlsLayout({ 
  onFire
}: MobileControlsLayoutProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [layout, setLayout] = useState<'default' | 'compact' | 'spread'>('default');

  // Handle joystick input (pass through continuous values)
  const handleJoystickMove = (x: number, y: number) => {
    // Pass through continuous values directly to the input system
    if (window.handleJoystickMove) {
      window.handleJoystickMove(x, y);
    }
  };

  // Check environment on mount
  useEffect(() => {
    const mobile = isMobile();
    const disabled = isJoystickDisabled();
    setShouldRender(mobile && !disabled);
    
    if (mobile && !disabled) {
      emitSubtleLog('📱', 'system');
      
      // Auto-detect layout based on screen size
      const screenWidth = window.innerWidth;
      if (screenWidth < 400) {
        setLayout('compact');
      } else if (screenWidth > 600) {
        setLayout('spread');
      } else {
        setLayout('default');
      }
    } else {
      emitSubtleLog('🖥️', 'system');
    }
  }, []);

  // Don't render anything on desktop
  if (!shouldRender) {
    return null;
  }

  const getLayoutStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      bottom: '0',
      left: '0',
      right: '0',
      height: '140px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '20px',
      pointerEvents: 'none' as const,
      zIndex: 1000,
    };

    switch (layout) {
      case 'compact':
        return {
          ...baseStyles,
          height: '120px',
          padding: '15px',
        };
      case 'spread':
        return {
          ...baseStyles,
          height: '160px',
          padding: '25px',
        };
      default:
        return baseStyles;
    }
  };

  const getJoystickPosition = () => {
    switch (layout) {
      case 'compact':
        return 'bottom-left';
      case 'spread':
        return 'bottom-left';
      default:
        return 'bottom-left';
    }
  };

  const getFireButtonPosition = () => {
    switch (layout) {
      case 'compact':
        return 'bottom-right';
      case 'spread':
        return 'bottom-right';
      default:
        return 'bottom-right';
    }
  };

  return (
    <div style={getLayoutStyles()}>
      {/* Joystick Area */}
      <div style={{ pointerEvents: 'auto' }}>
        <NativeJoystick onMove={handleJoystickMove} onFire={onFire} position="bottom-left" />
      </div>

      {/* Fire Button Area */}
      <div style={{ pointerEvents: 'auto' }}>
        <PixelatedFireButton 
          onFire={onFire} 
          position={getFireButtonPosition() as any}
        />
      </div>
    </div>
  );
}
