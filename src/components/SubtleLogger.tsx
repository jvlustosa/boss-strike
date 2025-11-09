import { useState, useEffect } from 'react';
import { isMobile } from '../game/core/environmentDetector';

interface LogEntry {
  id: number;
  message: string;
  timestamp: number;
  type: 'move' | 'fire' | 'system';
}

interface SubtleLoggerProps {
  enabled?: boolean;
  maxLogs?: number;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export function SubtleLogger({ 
  enabled = true, 
  maxLogs = 5, 
  position = 'bottom-right' 
}: SubtleLoggerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nextId, setNextId] = useState(1);

  // Only show logs on mobile devices
  const shouldShowLogs = enabled && isMobile();

  useEffect(() => {
    if (!shouldShowLogs) return;

    // Listen for custom log events
    const handleLogEvent = (event: CustomEvent) => {
      const { message, type = 'system' } = event.detail;
      
      const newLog: LogEntry = {
        id: nextId,
        message,
        timestamp: Date.now(),
        type
      };

      setLogs(prev => {
        const updated = [newLog, ...prev].slice(0, maxLogs);
        return updated;
      });

      setNextId(prev => prev + 1);

      // Auto-remove log after 1.5 seconds (faster fade)
      setTimeout(() => {
        setLogs(prev => prev.filter(log => log.id !== newLog.id));
      }, 1500);
    };

    window.addEventListener('subtleLog', handleLogEvent as EventListener);

    return () => {
      window.removeEventListener('subtleLog', handleLogEvent as EventListener);
    };
  }, [shouldShowLogs, maxLogs, nextId]);

  if (!shouldShowLogs || logs.length === 0) {
    return null;
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 1000,
      pointerEvents: 'none' as const,
      fontFamily: 'monospace',
      fontSize: '9px',
      lineHeight: '1.1',
    };

    switch (position) {
      case 'bottom-left':
        return { ...baseStyles, bottom: '160px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '160px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '60px', left: '20px' };
      case 'top-right':
        return { ...baseStyles, top: '60px', right: '20px' };
      default:
        return { ...baseStyles, bottom: '160px', right: '20px' };
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'move':
        return '#66BB6A'; // Lighter green for movement
      case 'fire':
        return '#FFB74D'; // Lighter orange for firing
      case 'system':
        return '#BDBDBD'; // Lighter gray for system messages
      default:
        return '#E0E0E0';
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(5px); }
            20% { opacity: 0.7; transform: translateY(0); }
            80% { opacity: 0.7; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-5px); }
          }
        `}
      </style>
      <div style={getPositionStyles()}>
        {logs.map((log) => (
          <div
            key={log.id}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              color: getLogColor(log.type),
              padding: '1px 4px',
              marginBottom: '1px',
              borderRadius: '2px',
              border: `1px solid ${getLogColor(log.type)}15`,
              opacity: 0.7,
              transition: 'opacity 0.2s ease',
              animation: 'fadeInOut 1.5s ease-in-out',
            }}
          >
            {log.message}
          </div>
        ))}
      </div>
    </>
  );
}

// Helper function to emit subtle logs
export function emitSubtleLog(message: string, type: LogEntry['type'] = 'system') {
  window.dispatchEvent(new CustomEvent('subtleLog', {
    detail: { message, type }
  }));
}
