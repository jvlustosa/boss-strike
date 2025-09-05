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

  // Expose touch handlers globally
  (window as any).handleTouchMove = handleTouchMove;
  (window as any).handleTouchFire = handleTouchFire;
  
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', onBlur);
  
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    window.removeEventListener('blur', onBlur);
    delete (window as any).handleTouchMove;
    delete (window as any).handleTouchFire;
  };
}
