import { useState, useEffect } from 'react';
import { PlayroomJoystick } from './PlayroomJoystick';
import { PlayroomAngularJoystick } from './PlayroomAngularJoystick';
import { emitSubtleLog } from './SubtleLogger';
import { shouldUsePlayroom, getEnvironmentInfo } from '../game/core/environmentDetector';

interface PlayroomJoystickControllerProps {
  onFire: () => void;
  defaultType?: 'dpad' | 'angular';
}

export function PlayroomJoystickController({ 
  onFire, 
  defaultType = 'dpad' 
}: PlayroomJoystickControllerProps) {
  const [joystickType, setJoystickType] = useState<'dpad' | 'angular'>(defaultType);
  const [shouldRender, setShouldRender] = useState(false);

  // Check environment on mount
  useEffect(() => {
    const usePlayroom = shouldUsePlayroom();
    setShouldRender(usePlayroom);
    
    if (usePlayroom) {
      console.log('PlayroomJoystickController: Mobile/Touch detected - Rendering joystick');
      emitSubtleLog('📱', 'system');
    } else {
      console.log('PlayroomJoystickController: Desktop detected - Keyboard controls only');
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
      emitSubtleLog(combined, 'move');
    }
  };

  // Toggle joystick type with keyboard shortcut (J key)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'j' && e.ctrlKey) {
        e.preventDefault();
        const newType = joystickType === 'dpad' ? 'angular' : 'dpad';
        setJoystickType(newType);
        emitSubtleLog(newType.toUpperCase(), 'system');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [joystickType]);

  // Don't render anything on desktop
  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {/* Render only the active joystick type */}
      {joystickType === 'dpad' ? (
        <PlayroomJoystick onFire={onFire} />
      ) : (
        <PlayroomAngularJoystick onMove={handleAngularMove} onFire={onFire} />
      )}
      
    </>
  );
}
