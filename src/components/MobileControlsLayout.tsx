import { useState, useEffect } from 'react';
import { PlayroomJoystick } from './PlayroomJoystick';
import { PlayroomAngularJoystick } from './PlayroomAngularJoystick';
import { PixelatedFireButton } from './PixelatedFireButton';
import { emitSubtleLog } from './SubtleLogger';
import { shouldUsePlayroom, getEnvironmentInfo } from '../game/core/environmentDetector';
import { isJoystickDisabled } from '../game/core/urlParams';

interface MobileControlsLayoutProps {
  onFire: () => void;
  defaultType?: 'dpad' | 'angular';
}

export function MobileControlsLayout({ 
  onFire, 
  defaultType = 'dpad' 
}: MobileControlsLayoutProps) {
  const [joystickType, setJoystickType] = useState<'dpad' | 'angular'>(defaultType);
  const [shouldRender, setShouldRender] = useState(false);
  const [layout, setLayout] = useState<'default' | 'compact' | 'spread'>('default');

  // Check environment on mount
  useEffect(() => {
    const usePlayroom = shouldUsePlayroom();
    const disabled = isJoystickDisabled();
    setShouldRender(usePlayroom && !disabled);
    
    if (usePlayroom && !disabled) {
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

  // Handle angular joystick input (pass through continuous values)
  const handleAngularMove = (x: number, y: number) => {
    // Pass through continuous values directly to the input system
    // The input system will handle simultaneous key presses
    if (window.handleJoystickMove) {
      window.handleJoystickMove(x, y);
    }
    
    // Only log when there's actual movement
    if (Math.abs(x) > 0.1 || Math.abs(y) > 0.1) {
      const direction = x > 0.1 ? 'right' : x < -0.1 ? 'left' : '';
      const vertical = y > 0.1 ? 'down' : y < -0.1 ? 'up' : '';
      const combined = [direction, vertical].filter(Boolean).join('+') || 'center';
      // emitSubtleLog(combined, 'move');
    }
  };

  // Toggle joystick type with keyboard shortcut (Ctrl+J)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'j' && e.ctrlKey) {
        e.preventDefault();
        const newType = joystickType === 'dpad' ? 'angular' : 'dpad';
        setJoystickType(newType);
        // emitSubtleLog(newType.toUpperCase(), 'system');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [joystickType]);

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
        {joystickType === 'dpad' ? (
          <PlayroomJoystick onFire={onFire} />
        ) : (
          <PlayroomAngularJoystick onMove={handleAngularMove} onFire={onFire} />
        )}
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
