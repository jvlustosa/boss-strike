import { useState } from 'react';
import { PlayroomJoystick } from './PlayroomJoystick';
import { PlayroomAngularJoystick } from './PlayroomAngularJoystick';

export function JoystickDemo() {
  const [joystickType, setJoystickType] = useState<'dpad' | 'angular'>('dpad');
  const [lastInput, setLastInput] = useState<string>('');

  const handleDpadMove = (direction: 'left' | 'right' | 'up' | 'down' | null) => {
    setLastInput(`D-Pad: ${direction || 'none'}`);
  };

  const handleAngularMove = (x: number, y: number) => {
    setLastInput(`Angular: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
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
      <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Playroom Joystick Demo</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>Joystick Type:</label>
        <select 
          value={joystickType} 
          onChange={(e) => setJoystickType(e.target.value as 'dpad' | 'angular')}
          style={{
            padding: '5px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            background: 'white',
            color: 'black'
          }}
        >
          <option value="dpad">D-Pad (Discrete)</option>
          <option value="angular">Angular (Continuous)</option>
        </select>
      </div>

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
        <p>• Use WASD keys to control the joystick</p>
        <p>• Touch/click the joystick on mobile</p>
        <p>• Press the Fire button to shoot</p>
        <p>• D-Pad: Discrete directions</p>
        <p>• Angular: Continuous X/Y values</p>
      </div>

      {/* Render the appropriate joystick */}
      {joystickType === 'dpad' ? (
        <PlayroomJoystick onMove={handleDpadMove} onFire={handleFire} />
      ) : (
        <PlayroomAngularJoystick onMove={handleAngularMove} onFire={handleFire} />
      )}
    </div>
  );
}
