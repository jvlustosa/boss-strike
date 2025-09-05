import { GameCanvas } from './components/GameCanvas';

export default function App() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
    }}>
      <GameCanvas />
    </div>
  );
}
