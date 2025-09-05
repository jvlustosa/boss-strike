export function registerInput(keys: Record<string, boolean>) {
  const onDown = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = true;
  };
  
  const onUp = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };
  
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  
  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
  };
}
