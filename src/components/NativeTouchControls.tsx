import React, { useEffect, useRef, useState } from 'react';

/**
 * Native Touch Controls (No Playroom)
 * Pure React touch-based joystick for mobile
 */

interface NativeTouchControlsProps {
  onMove: (x: number, y: number) => void;
  onFire: () => void;
}

export function NativeTouchControls({ onMove, onFire }: NativeTouchControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const touchRef = useRef<{ identifier: number; x: number; y: number } | null>(null);

  // Joystick size
  const JOYSTICK_SIZE = 80;
  const JOYSTICK_RADIUS = JOYSTICK_SIZE / 2;
  const THUMB_SIZE = 40;
  const THUMB_RADIUS = THUMB_SIZE / 2;
  const DEADZONE = 10;

  // Joystick touch handlers
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    if (touchRef.current) return; // Already tracking a touch

    const touch = e.touches[0];
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;

    touchRef.current = {
      identifier: touch.identifier,
      x: touch.clientX - rect.left - JOYSTICK_RADIUS,
      y: touch.clientY - rect.top - JOYSTICK_RADIUS,
    };

    setIsJoystickActive(true);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;

    const touch = Array.from(e.touches).find(t => t.identifier === touchRef.current?.identifier);
    if (!touch) return;

    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left - JOYSTICK_RADIUS;
    const y = touch.clientY - rect.top - JOYSTICK_RADIUS;

    // Calculate distance and angle
    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = JOYSTICK_RADIUS - THUMB_RADIUS / 2;

    // Apply deadzone
    if (distance < DEADZONE) {
      onMove(0, 0);
      return;
    }

    // Clamp to joystick bounds
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(y, x);

    // Convert to normalized coordinates (-1 to 1)
    const normalizedX = (Math.cos(angle) * clampedDistance) / maxDistance;
    const normalizedY = (Math.sin(angle) * clampedDistance) / maxDistance;

    touchRef.current = { identifier: touch.identifier, x: normalizedX, y: normalizedY };
    onMove(normalizedX, normalizedY);
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;

    const touchExists = Array.from(e.touches).some(t => t.identifier === touchRef.current?.identifier);
    if (!touchExists) {
      touchRef.current = null;
      setIsJoystickActive(false);
      onMove(0, 0);
    }
  };

  // Fire button handlers
  const handleFireTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    onFire();
  };

  // Get thumb position
  const getThumbPosition = () => {
    if (!touchRef.current) {
      return { x: JOYSTICK_RADIUS - THUMB_RADIUS / 2, y: JOYSTICK_RADIUS - THUMB_RADIUS / 2 };
    }

    const x = JOYSTICK_RADIUS + touchRef.current.x * (JOYSTICK_RADIUS - THUMB_RADIUS / 2);
    const y = JOYSTICK_RADIUS + touchRef.current.y * (JOYSTICK_RADIUS - THUMB_RADIUS / 2);

    return {
      x: Math.max(THUMB_RADIUS / 2, Math.min(x, JOYSTICK_SIZE - THUMB_RADIUS / 2)),
      y: Math.max(THUMB_RADIUS / 2, Math.min(y, JOYSTICK_SIZE - THUMB_RADIUS / 2)),
    };
  };

  const thumbPos = getThumbPosition();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '0',
      right: '0',
      height: '160px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '20px',
      pointerEvents: 'none',
      zIndex: 1000,
    }}>
      {/* Joystick */}
      <div
        ref={joystickRef}
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
        style={{
          width: `${JOYSTICK_SIZE}px`,
          height: `${JOYSTICK_SIZE}px`,
          backgroundColor: 'rgba(100, 100, 100, 0.3)',
          borderRadius: '50%',
          border: '2px solid rgba(100, 255, 100, 0.5)',
          position: 'relative',
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      >
        {/* Thumb */}
        <div
          style={{
            width: `${THUMB_SIZE}px`,
            height: `${THUMB_SIZE}px`,
            backgroundColor: 'rgba(100, 255, 100, 0.7)',
            borderRadius: '50%',
            border: '2px solid rgba(100, 255, 100, 1)',
            position: 'absolute',
            left: `${thumbPos.x - THUMB_RADIUS / 2}px`,
            top: `${thumbPos.y - THUMB_RADIUS / 2}px`,
            transition: isJoystickActive ? 'none' : 'all 0.1s ease-out',
            boxShadow: isJoystickActive ? '0 0 10px rgba(100, 255, 100, 0.8)' : 'none',
          }}
        />

        {/* Grid lines */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0.2,
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: '0', width: '100%', height: '1px', backgroundColor: 'rgba(100, 255, 100, 0.5)' }} />
          <div style={{ position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', backgroundColor: 'rgba(100, 255, 100, 0.5)' }} />
        </div>
      </div>

      {/* Fire Button */}
      <div
        onTouchStart={handleFireTouchStart}
        style={{
          width: '70px',
          height: '70px',
          backgroundColor: 'rgba(255, 100, 100, 0.3)',
          borderRadius: '50%',
          border: '2px solid rgba(255, 100, 100, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          fontWeight: 'bold',
          color: 'rgba(255, 100, 100, 1)',
          pointerEvents: 'auto',
          touchAction: 'none',
          textShadow: '1px 1px 0px #000',
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.1s ease',
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
          handleFireTouchStart(e);
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        🔥
      </div>
    </div>
  );
}

