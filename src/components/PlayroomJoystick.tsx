import { useEffect } from 'react';
import { playroomSession } from '../game/core/playroomSession';
import { shouldUsePlayroom, getEnvironmentInfo } from '../game/core/environmentDetector';

interface PlayroomJoystickProps {
  onFire: () => void;
}

export function PlayroomJoystick({ onFire }: PlayroomJoystickProps) {
  useEffect(() => {
    // Check if we should use Playroom (only on mobile/touch devices)
    if (!shouldUsePlayroom()) {
      return;
    }

    // Check if session is already initialized or initializing
    if (playroomSession.isReady()) {
      playroomSession.setCallbacks({ onFire });
      return;
    }
    
    if (playroomSession.isInitializing()) {
      // Wait for initialization to complete, then set callbacks
      playroomSession.initialize().then(() => {
        playroomSession.setCallbacks({ onFire });
      }).catch((error) => {
        console.error('PlayroomJoystick initialization failed:', error);
      });
      return;
    }
    
    // Initialize the persistent Playroom session
    playroomSession.initialize().then(() => {
      playroomSession.setCallbacks({ onFire });
    }).catch((error) => {
      console.error('PlayroomJoystick initialization failed:', error);
    });

    // Listen for soft restart events (game restart/level change)
    const handleSoftRestart = () => {
      playroomSession.softRestart();
    };

    window.addEventListener('forceJoystickCleanup', handleSoftRestart);

    return () => {
      // Only cleanup on component unmount, not on game restart
      window.removeEventListener('forceJoystickCleanup', handleSoftRestart);
      playroomSession.cleanup();
    };
  }, [onFire]);

  // This component doesn't render anything visible
  // The joystick UI is handled by Playroom
  return null;
}