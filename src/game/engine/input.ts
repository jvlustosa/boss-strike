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
  
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', onBlur);
  
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    window.removeEventListener('blur', onBlur);
  };
}
