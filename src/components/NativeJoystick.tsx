import { useState, useRef, useEffect } from 'react';

interface NativeJoystickProps {
  onMove: (x: number, y: number) => void;
  onFire?: () => void;
  position?: 'bottom-left' | 'bottom-right';
}

export function NativeJoystick({ onMove, onFire, position = 'bottom-left' }: NativeJoystickProps) {
  const [isActive, setIsActive] = useState(false);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  const JOYSTICK_SIZE = 120;
  const KNOB_SIZE = 50;
  const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2;
  const DEADZONE = 0.1;

  const getContainerPosition = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  };

  const calculateMovement = (clientX: number, clientY: number) => {
    const center = getContainerPosition();
    const deltaX = clientX - center.x;
    const deltaY = clientY - center.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit to max distance
    const limitedDistance = Math.min(distance, MAX_DISTANCE);
    let angle = Math.atan2(deltaY, deltaX);
    
    // Convert angle to degrees (0-360)
    let angleDeg = (angle * 180 / Math.PI + 360) % 360;
    
    // Define diagonal angle ranges for each quadrant
    const diagonalRanges = [
      { min: 30, max: 60 },      // Q1: 30-60°
      { min: 120, max: 150 },    // Q2: 120-150°
      { min: 210, max: 240 },    // Q3: 210-240°
      { min: 300, max: 330 },    // Q4: 300-330°
    ];
    
    // Check if angle is in diagonal range
    const isDiagonal = diagonalRanges.some(range => 
      angleDeg >= range.min && angleDeg <= range.max
    );
    
    // If not diagonal, snap to nearest cardinal direction
    if (!isDiagonal) {
      const cardinals = [0, 90, 180, 270];
      let nearestCardinal = cardinals[0];
      let minDiff = Math.abs(angleDeg - cardinals[0]);
      
      for (const cardinal of cardinals) {
        const diff = Math.min(
          Math.abs(angleDeg - cardinal),
          Math.abs(angleDeg - (cardinal + 360)),
          Math.abs(angleDeg - (cardinal - 360))
        );
        if (diff < minDiff) {
          minDiff = diff;
          nearestCardinal = cardinal;
        }
      }
      
      angleDeg = nearestCardinal;
      angle = nearestCardinal * Math.PI / 180;
    }
    
    // Calculate knob position
    const knobX = Math.cos(angle) * limitedDistance;
    const knobY = Math.sin(angle) * limitedDistance;
    
    // Calculate normalized movement values (-1 to 1)
    const normalizedDistance = limitedDistance / MAX_DISTANCE;
    const magnitude = Math.max(0, (normalizedDistance - DEADZONE) / (1 - DEADZONE));
    
    // Convert angle to x/y movement
    const x = Math.cos(angle) * magnitude;
    const y = Math.sin(angle) * magnitude;
    
    return { knobX, knobY, x, y };
  };

  const handleStart = (clientX: number, clientY: number, touchId?: number) => {
    if (touchId !== undefined) {
      touchIdRef.current = touchId;
    }
    setIsActive(true);
    const movement = calculateMovement(clientX, clientY);
    setJoystickPosition({ x: movement.knobX, y: movement.knobY });
    onMove(movement.x, movement.y);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isActive) return;
    const movement = calculateMovement(clientX, clientY);
    setJoystickPosition({ x: movement.knobX, y: movement.knobY });
    onMove(movement.x, movement.y);
  };

  const handleEnd = () => {
    setIsActive(false);
    setJoystickPosition({ x: 0, y: 0 });
    onMove(0, 0);
    touchIdRef.current = null;
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isActive) return;
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    if (isActive) {
      handleEnd();
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, touch.identifier);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isActive || touchIdRef.current === null) return;
    e.preventDefault();
    
    // Find the touch with matching ID
    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
    if (touch) {
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isActive) return;
    
    // Check if our touch is still active
    const touchStillActive = Array.from(e.touches).some(t => t.identifier === touchIdRef.current);
    if (!touchStillActive) {
      handleEnd();
    }
  };

  // Global mouse events for drag outside element
  useEffect(() => {
    if (isActive) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX, e.clientY);
      };
      
      const handleGlobalMouseUp = () => {
        handleEnd();
      };
      
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isActive]);

  const positionStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    left: position === 'bottom-left' ? '20px' : 'auto',
    right: position === 'bottom-right' ? '20px' : 'auto',
    zIndex: 1000,
    pointerEvents: 'auto',
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...positionStyles,
        width: `${JOYSTICK_SIZE}px`,
        height: `${JOYSTICK_SIZE}px`,
        borderRadius: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '3px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        ref={joystickRef}
        style={{
          width: `${KNOB_SIZE}px`,
          height: `${KNOB_SIZE}px`,
          borderRadius: '50%',
          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
          transition: isActive ? 'none' : 'transform 0.2s ease-out',
          boxShadow: isActive 
            ? '0 0 10px rgba(255, 255, 255, 0.5)' 
            : '0 2px 4px rgba(0, 0, 0, 0.3)',
        }}
      />
    </div>
  );
}

