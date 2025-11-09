import { useState } from 'react';
import { NativeJoystick } from './NativeJoystick';

export function JoystickDemo() {
  const [lastInput, setLastInput] = useState<string>('');

  const handleMove = (x: number, y: number) => {
    setLastInput(`Native: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
  };

  const handleFire = () => {
    setLastInput('Fire button pressed!');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      zIndex: 1000,
      minWidth: '300px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Native Joystick Demo</h3>

      <div style={{ marginBottom: '15px' }}>
        <strong>Last Input:</strong>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          padding: '5px', 
          borderRadius: '4px',
          marginTop: '5px',
          minHeight: '20px'
        }}>
          {lastInput || 'No input yet...'}
        </div>
      </div>

      <div style={{ fontSize: '12px', color: '#ccc' }}>
        <p>• Touch/click the joystick to move</p>
        <p>• Supports all directions (horizontal, vertical, diagonal)</p>
        <p>• Variable speed based on distance from center</p>
        <p>• Press the Fire button to shoot</p>
      </div>

      {/* Render the native joystick */}
      <NativeJoystick onMove={handleMove} onFire={handleFire} position="bottom-left" />
    </div>
  );
}
