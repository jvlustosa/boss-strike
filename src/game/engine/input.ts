export function registerInput(keys: Record<string, boolean>) {
  const preventKeys = new Set([
    'arrowleft',
    'arrowright',
    'arrowup',
    'arrowdown',
    'w',
    'a',
    's',
    'd',
    ' ',
    'space',
  ]);

  const onDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (preventKeys.has(k)) e.preventDefault();
  };
  
  const onUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    keys[k] = false;
    if (preventKeys.has(k)) e.preventDefault();
  };

  const onBlur = () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  };

  // Touch input handling
  const handleTouchMove = (direction: 'left' | 'right' | 'up' | 'down' | null) => {
    // Clear all movement keys first
    keys['a'] = false;
    keys['d'] = false;
    keys['w'] = false;
    keys['s'] = false;
    keys['arrowleft'] = false;
    keys['arrowright'] = false;
    keys['arrowup'] = false;
    keys['arrowdown'] = false;

    // Set the appropriate key based on direction
    if (direction) {
      switch (direction) {
        case 'left':
          keys['a'] = true;
          keys['arrowleft'] = true;
          break;
        case 'right':
          keys['d'] = true;
          keys['arrowright'] = true;
          break;
        case 'up':
          keys['w'] = true;
          keys['arrowup'] = true;
          break;
        case 'down':
          keys['s'] = true;
          keys['arrowdown'] = true;
          break;
      }
    }
  };

  const handleTouchFire = () => {
    keys[' '] = true;
    keys['space'] = true;
    // Auto-release after a short time to prevent continuous firing
    setTimeout(() => {
      keys[' '] = false;
      keys['space'] = false;
    }, 100);
  };

  // Handle continuous joystick input (x, y values from -1 to 1)
  const handleJoystickMove = (x: number, y: number) => {
    // Clear all movement keys first
    keys['a'] = false;
    keys['d'] = false;
    keys['w'] = false;
    keys['s'] = false;
    keys['arrowleft'] = false;
    keys['arrowright'] = false;
    keys['arrowup'] = false;
    keys['arrowdown'] = false;

    // Use smaller deadzone for more responsive movement
    const deadzone = 0.05;
    
    // Set keys based on joystick values - allow simultaneous movement
    if (Math.abs(x) > deadzone) {
      if (x < 0) {
        keys['a'] = true;
        keys['arrowleft'] = true;
      } else {
        keys['d'] = true;
        keys['arrowright'] = true;
      }
    }
    
    if (Math.abs(y) > deadzone) {
      if (y < 0) {
        keys['w'] = true;
        keys['arrowup'] = true;
      } else {
        keys['s'] = true;
        keys['arrowdown'] = true;
      }
    }
  };

  // Force clear all input keys
  const forceClearInput = () => {
    for (const key in keys) {
      keys[key] = false;
    }
  };

  // Force reinitialize input system
  const forceReinitInput = () => {
    
    // Clear all keys first
    for (const key in keys) {
      keys[key] = false;
    }
    
    // Re-expose handlers to ensure they're available
    (window as any).handleTouchMove = handleTouchMove;
    (window as any).handleTouchFire = handleTouchFire;
    (window as any).handleJoystickMove = handleJoystickMove;
    (window as any).forceClearInput = forceClearInput;
    (window as any).forceReinitInput = forceReinitInput;
    
  };

  // Expose touch handlers globally
  (window as any).handleTouchMove = handleTouchMove;
  (window as any).handleTouchFire = handleTouchFire;
  (window as any).handleJoystickMove = handleJoystickMove;
  (window as any).forceClearInput = forceClearInput;
  (window as any).forceReinitInput = forceReinitInput;
  
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', onBlur);
  
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    window.removeEventListener('blur', onBlur);
    delete (window as any).handleTouchMove;
    delete (window as any).handleTouchFire;
    delete (window as any).handleJoystickMove;
    delete (window as any).forceClearInput;
    delete (window as any).forceReinitInput;
  };
}
