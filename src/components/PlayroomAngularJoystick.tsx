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
      console.log('Desktop detected - Playroom Angular disabled:', getEnvironmentInfo());
      return;
    }

    console.log('Mobile/Touch detected - Initializing Playroom Angular:', getEnvironmentInfo());
    
    // Initialize the persistent Playroom Angular session
    playroomAngularSession.initialize();
    
    // Set callbacks for this component
    playroomAngularSession.setCallbacks({ onMove, onFire });

    // Listen for soft restart events (game restart/level change)
    const handleSoftRestart = () => {
      console.log('PlayroomAngularJoystick: Soft restart triggered');
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