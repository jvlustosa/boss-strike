import React from 'react';
import { isDesktop } from '../game/core/environmentDetector';

export function DesktopControls() {
  // Only show on desktop
  if (!isDesktop()) {
    return null;
  }

  const keyStyle: React.CSSProperties = {
    display: 'inline-block',
    backgroundColor: '#2a2a2a',
    color: '#999',
    border: '1px solid #444',
    borderRadius: '2px',
    padding: '2px 4px',
    margin: '1px',
    fontFamily: "'Pixelify Sans', monospace",
    fontSize: '10px',
    fontWeight: 'bold',
    textShadow: '1px 1px 0px #000',
    letterSpacing: '0.3px',
    minWidth: '16px',
    textAlign: 'center',
    boxShadow: 'inset 0 1px 0 #555, 0 1px 0 #1a1a1a',
    opacity: 0.7,
  };

  const spaceKeyStyle: React.CSSProperties = {
    ...keyStyle,
    minWidth: '60px',
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <div style={{ display: 'flex', gap: '1px' }}>
          <span style={keyStyle}>W</span>
        </div>
        <div style={{ display: 'flex', gap: '1px' }}>
          <span style={keyStyle}>A</span>
          <span style={keyStyle}>S</span>
          <span style={keyStyle}>D</span>
        </div>
      </div>
      
      <span style={{ 
        color: '#666', 
        fontSize: '12px', 
        fontFamily: "'Pixelify Sans', monospace",
        textShadow: '1px 1px 0px #000',
        opacity: 0.6,
      }}>+</span>
      
      <span style={spaceKeyStyle}>ESPAÇO</span>
    </div>
  );
}
