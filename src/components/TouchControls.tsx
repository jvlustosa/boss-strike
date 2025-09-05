import { useEffect, useRef } from 'react';
import { insertCoin, myPlayer, onPlayerJoin, Joystick } from 'playroomkit';

interface TouchControlsProps {
  onMove: (direction: 'left' | 'right' | 'up' | 'down' | null) => void;
  onFire: () => void;
}

export function TouchControls({ onMove, onFire }: TouchControlsProps) {
  // Detecção mais robusta de dispositivos móveis
  const isMobile = useRef(() => {
    // Verifica User Agent
    const userAgent = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    
    // Verifica se tem touch screen
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Verifica tamanho da tela (dispositivos móveis geralmente têm largura < 768px)
    const isSmallScreen = window.innerWidth <= 768;
    
    return mobileRegex.test(userAgent) || (hasTouch && isSmallScreen);
  }).current;

  const joystickRef = useRef<Joystick | null>(null);
  const initializedRef = useRef(false);
  
  // Só inicializa o joystick se for mobile
  if (!isMobile()) {
    return null;
  }

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializePlayroom = async () => {
      try {
        // Start the game
        await insertCoin();
        
        // Create a joystick controller for the current player
        onPlayerJoin((state) => {
          if (state.id === myPlayer().id) {
            const joystick = new Joystick(state, {
              type: "dpad",
              buttons: [
                { id: "fire", label: "FIRE" }
              ],
              keyboard: false // Disable W,A,S,D keys to avoid conflicts with game controls
            });
            joystickRef.current = joystick;
          }
        });
      } catch (error) {
        console.warn('Failed to initialize Playroom joystick:', error);
      }
    };

    // Só inicializa se for mobile
    if (isMobile()) {
      initializePlayroom();
    }
  }, [isMobile]);

  // Update input based on joystick state
  useEffect(() => {
    if (!joystickRef.current) return;

    const updateInput = () => {
      const joystick = joystickRef.current;
      if (!joystick) return;

      const dpad = joystick.dpad();
      let direction: 'left' | 'right' | 'up' | 'down' | null = null;

      if (dpad.x === "left") {
        direction = 'left';
      } else if (dpad.x === "right") {
        direction = 'right';
      } else if (dpad.y === "up") {
        direction = 'up';
      } else if (dpad.y === "down") {
        direction = 'down';
      }

      onMove(direction);

      // Check if fire button is pressed
      if (joystick.isPressed("fire")) {
        onFire();
      }
    };

    const interval = setInterval(updateInput, 16); // ~60fps
    return () => clearInterval(interval);
  }, [onMove, onFire]);

  // Playroom handles the UI rendering - joystick só aparece no mobile
  return null;
}
