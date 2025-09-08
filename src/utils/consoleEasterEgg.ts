// Console Easter Egg for Boss Attack Game
export function showConsoleEasterEgg() {
  const styles = {
    title: 'color: #ff6b6b; font-size: 24px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);',
    subtitle: 'color: #4ecdc4; font-size: 16px; font-weight: bold;',
    text: 'color: #45b7d1; font-size: 14px;',
    highlight: 'color: #f9ca24; font-weight: bold;',
    code: 'color: #6c5ce7; font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;',
    ascii: 'color: #ffd700; font-family: monospace; font-size: 12px; line-height: 1;'
  };

  // ASCII Art do Pac-Man (👾)
  const pacmanAscii = `
    ████████████████
  ████████████████████
 ██████████████████████
████████████████████████
████████████████████████
████████████████████████
████████████████████████
████████████████████████
████████████████████████
████████████████████████
████████████████████████
████████████████████████
████████████████████████
 ██████████████████████
  ████████████████████
    ████████████████
`;

  console.log('%c🎮 BOSS ATTACK 🎮', styles.title);
  console.log('%cDesenvolvido com ❤️ por Dudu', styles.subtitle);
  console.log('');
  console.log('%c' + pacmanAscii, styles.ascii);
  console.log('');
  console.log('%c' + '='.repeat(50), 'color: #ddd;');
}

// Auto-show Easter egg when console is opened
if (typeof window !== 'undefined') {
  // Show immediately
  showConsoleEasterEgg();
  
  // Also show when console is opened (detected by console methods being called)
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  let easterEggShown = false;
  
  function checkAndShowEasterEgg() {
    if (!easterEggShown) {
      easterEggShown = true;
      setTimeout(() => {
        console.log('%c👾 Console ativado! 👾', 'color: #ff6b6b; font-size: 16px; font-weight: bold;');
        console.log('%cASCII art carregado! 🏆', 'color: #4ecdc4; font-size: 14px;');
      }, 1000);
    }
  }
  
  console.log = function(...args) {
    checkAndShowEasterEgg();
    return originalLog.apply(console, args);
  };
  
  console.error = function(...args) {
    checkAndShowEasterEgg();
    return originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    checkAndShowEasterEgg();
    return originalWarn.apply(console, args);
  };
}
