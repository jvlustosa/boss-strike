import { useEffect } from 'react';
import { playroomAngularSession } from '../game/core/playroomAngularSession';
import { shouldUsePlayroom, getEnvironmentInfo } from '../game/core/environmentDetector';

interface PlayroomAngularJoystickProps {
  onMove: (x: number, y: number) => void; // -1 to 1 for both x and y
  onFire: () => void;
}

export function PlayroomAngularJoystick({ onMove, onFire }: PlayroomAngularJoystickProps) {
  useEffect(() => {
    // Check if we should use Playroom (only on mobile/touch devices)
    if (!shouldUsePlayroom()) {
      return;
    }

    // Check if session is already initialized or initializing
    if (playroomAngularSession.isReady()) {
      playroomAngularSession.setCallbacks({ onMove, onFire });
      return;
    }
    
    if (playroomAngularSession.isInitializing()) {
      // Wait for initialization to complete, then set callbacks
      playroomAngularSession.initialize().then(() => {
        playroomAngularSession.setCallbacks({ onMove, onFire });
      }).catch((error) => {
        console.error('PlayroomAngularJoystick initialization failed:', error);
      });
      return;
    }
    
    // Initialize the persistent Playroom Angular session
    playroomAngularSession.initialize().then(() => {
      playroomAngularSession.setCallbacks({ onMove, onFire });
    }).catch((error) => {
      console.error('PlayroomAngularJoystick initialization failed:', error);
    });

    // Listen for soft restart events (game restart/level change)
    const handleSoftRestart = () => {
      playroomAngularSession.softRestart();
    };

    window.addEventListener('forceJoystickCleanup', handleSoftRestart);

    return () => {
      // Only cleanup on component unmount, not on game restart
      window.removeEventListener('forceJoystickCleanup', handleSoftRestart);
      playroomAngularSession.cleanup();
    };
  }, [onMove, onFire]);

  // This component doesn't render anything visible
  // The joystick UI is handled by Playroom
  return null;
}