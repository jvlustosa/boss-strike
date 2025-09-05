import { useEffect } from 'react';
import { playroomSession } from '../game/core/playroomSession';
import { shouldUsePlayroom, getEnvironmentInfo } from '../game/core/environmentDetector';

interface PlayroomJoystickProps {
  onFire: () => void;
}

export function PlayroomJoystick({ onFire }: PlayroomJoystickProps) {
  useEffect(() => {
    console.log('🎮 PlayroomJoystick: useEffect started');
    const envInfo = getEnvironmentInfo();
    console.log('🎮 PlayroomJoystick: Environment info:', envInfo);
    
    // Check if we should use Playroom (only on mobile/touch devices)
    if (!shouldUsePlayroom()) {
      console.log('🎮 PlayroomJoystick: Desktop detected - Playroom disabled:', envInfo);
      return;
    }

    console.log('🎮 PlayroomJoystick: Mobile/Touch detected - Initializing Playroom:', envInfo);
    
    // Initialize the persistent Playroom session
    console.log('🎮 PlayroomJoystick: About to call playroomSession.initialize()');
    playroomSession.initialize().then(() => {
      console.log('🎮 PlayroomJoystick: playroomSession.initialize() completed successfully');
      console.log('🎮 PlayroomJoystick: Session is ready:', playroomSession.isReady());
    }).catch((error) => {
      console.error('🎮 PlayroomJoystick: playroomSession.initialize() failed:', error);
      console.error('🎮 PlayroomJoystick: Error details:', error.message, error.stack);
    });
    
    // Set callbacks for this component
    console.log('🎮 PlayroomJoystick: Setting callbacks');
    playroomSession.setCallbacks({ onFire });

    // Listen for soft restart events (game restart/level change)
    const handleSoftRestart = () => {
      console.log('PlayroomJoystick: Soft restart triggered');
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