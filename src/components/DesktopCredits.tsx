import React from 'react';
import { isDesktop } from '../game/core/environmentDetector';

export function DesktopCredits() {
  // Only show on desktop
  if (!isDesktop()) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      color: '#888',
      fontFamily: "'Pixelify Sans', monospace",
      fontSize: '12px',
      fontWeight: 'bold',
      textShadow: '1px 1px 0px #000',
      letterSpacing: '1px',
      zIndex: 1000,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      padding: '6px 10px',
      borderRadius: '3px',
      border: '1px solid #444',
      opacity: 0.8,
    }}>
      by Duspace
    </div>
  );
}
