# Playroom Joystick Integration

This project now includes Playroom joystick support for enhanced multiplayer gaming experience.

## Features

- **D-Pad Joystick**: Discrete directional input (left, right, up, down)
- **Angular Joystick**: Continuous X/Y input values (-1 to 1)
- **Keyboard Support**: WASD keys control the joystick
- **Touch Support**: Mobile-friendly touch controls
- **Customizable**: Size, deadzone, and button configuration
- **Multiplayer Ready**: Supports multiple players with Playroom

## Components

### PlayroomJoystick
D-Pad style joystick for discrete movement:
```tsx
<PlayroomJoystick 
  onMove={(direction) => {
    // direction: 'left' | 'right' | 'up' | 'down' | null
  }} 
  onFire={() => {
    // Fire button pressed
  }} 
/>
```

### PlayroomAngularJoystick
Angular joystick for continuous movement:
```tsx
<PlayroomAngularJoystick 
  onMove={(x, y) => {
    // x, y: -1 to 1 values
  }} 
  onFire={() => {
    // Fire button pressed
  }} 
/>
```

## Configuration Options

Both joystick types support these options:

```tsx
const joystick = new Joystick(state, {
  type: "dpad" | "angular",
  buttons: [
    { id: "fire", label: "Fire" }
  ],
  keyboard: true, // Enable WASD keys
  size: 120, // Joystick size in pixels
  deadzone: 0.1 // Deadzone to prevent accidental movements
});
```

## Integration with Game

The joysticks are integrated with the existing input system:

1. **D-Pad joystick** calls `handleTouchMove(direction)` 
2. **Angular joystick** calls `handleJoystickMove(x, y)`
3. Both call `handleTouchFire()` for fire button

The input system converts these to keyboard events that the game already understands.

## Usage Examples

### Basic D-Pad
```tsx
import { PlayroomJoystick } from './components/PlayroomJoystick';

function Game() {
  const handleMove = (direction) => {
    if (direction === 'left') {
      // Move player left
    } else if (direction === 'right') {
      // Move player right
    }
    // etc.
  };

  return (
    <div>
      <PlayroomJoystick onMove={handleMove} onFire={handleFire} />
    </div>
  );
}
```

### Angular Joystick with Continuous Movement
```tsx
import { PlayroomAngularJoystick } from './components/PlayroomAngularJoystick';

function Game() {
  const handleMove = (x, y) => {
    // x and y are values from -1 to 1
    player.x += x * speed * deltaTime;
    player.y += y * speed * deltaTime;
  };

  return (
    <div>
      <PlayroomAngularJoystick onMove={handleMove} onFire={handleFire} />
    </div>
  );
}
```

### Converting Angular to Degrees
```tsx
function radToDeg(rad) {
  return rad * 180 / Math.PI + 90;
}

const angle = joystick.angle();
const degrees = radToDeg(angle);
console.log(`Joystick angle: ${degrees}°`);
```

### Converting Angular to X/Y Components
```tsx
function radToXY(rad) {
  return {
    y: Math.cos(rad),
    x: Math.sin(rad)
  };
}

const { x, y } = radToXY(joystick.angle());
console.log(`X: ${x}, Y: ${y}`);
```

## Demo Component

Use `JoystickDemo` component to test different joystick configurations:

```tsx
import { JoystickDemo } from './components/JoystickDemo';

function App() {
  return (
    <div>
      <JoystickDemo />
      {/* Your game content */}
    </div>
  );
}
```

## Multiplayer Setup

The joysticks automatically handle multiplayer through Playroom:

1. Each player gets their own joystick instance
2. Only the current player sees the UI
3. Other players' joystick states are synced automatically
4. Use `myPlayer()` to identify the current player

## Troubleshooting

- **Joystick not appearing**: Check browser console for Playroom initialization errors
- **Input not working**: Verify the input handlers are properly connected
- **Mobile issues**: Ensure touch events are not being prevented by other elements
- **Keyboard not working**: Check that `keyboard: true` is set in joystick config

## Browser Support

- Modern browsers with ES6+ support
- Mobile browsers with touch support
- Requires Playroom account and room setup for multiplayer features
