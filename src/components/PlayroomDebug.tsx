import { useEffect, useState } from 'react';
import { shouldUsePlayroom, getEnvironmentInfo } from '../game/core/environmentDetector';

export function PlayroomDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [playroomStatus, setPlayroomStatus] = useState<string>('Not initialized');

  useEffect(() => {
    const envInfo = getEnvironmentInfo();
    setDebugInfo(envInfo);
    
    // Test PlayroomKit import
    import('playroomkit').then((PlayroomKit) => {
      console.log('🔍 PlayroomDebug: PlayroomKit imported successfully:', PlayroomKit);
      setPlayroomStatus('PlayroomKit imported successfully');
      
      // Test basic functionality
      if (PlayroomKit.insertCoin && PlayroomKit.onPlayerJoin && PlayroomKit.Joystick) {
        setPlayroomStatus('PlayroomKit methods available');
      } else {
        setPlayroomStatus('PlayroomKit methods missing');
      }
    }).catch((error) => {
      console.error('🔍 PlayroomDebug: PlayroomKit import failed:', error);
      setPlayroomStatus('PlayroomKit import failed: ' + error.message);
    });
  }, []);

  if (!shouldUsePlayroom()) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        <div>Desktop Mode - Playroom Disabled</div>
        <div>User Agent: {debugInfo.userAgent}</div>
        <div>Touch Points: {debugInfo.maxTouchPoints}</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Mobile Mode - Playroom Enabled</strong></div>
      <div>Status: {playroomStatus}</div>
      <div>User Agent: {debugInfo.userAgent}</div>
      <div>Touch Points: {debugInfo.maxTouchPoints}</div>
      <div>Screen: {debugInfo.screenWidth}x{debugInfo.screenHeight}</div>
      <div>Window: {debugInfo.windowInnerWidth}x{debugInfo.windowInnerHeight}</div>
      <div>Mobile: {debugInfo.isMobile ? 'Yes' : 'No'}</div>
      <div>Touch: {debugInfo.isTouchDevice ? 'Yes' : 'No'}</div>
      <div>Desktop: {debugInfo.isDesktop ? 'Yes' : 'No'}</div>
    </div>
  );
}
