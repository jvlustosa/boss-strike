import { useEffect } from 'react';
import { PIXEL_FONT } from '../utils/fonts';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  errorCode?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id);
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const getToastStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'relative',
      padding: isMobile ? '12px 16px' : '14px 20px',
      marginBottom: '12px',
      backgroundColor: '#111',
      border: '4px solid',
      fontFamily: PIXEL_FONT,
      fontSize: isMobile ? '13px' : '15px',
      color: '#fff',
      boxShadow: '0 0 0 3px #333, 6px 6px 0px #333',
      minWidth: isMobile ? '280px' : '320px',
      maxWidth: '90%',
      wordWrap: 'break-word' as const,
      imageRendering: 'pixelated' as any,
    };

    switch (toast.type) {
      case 'success':
        return {
          ...baseStyle,
          borderColor: '#4ade80',
          backgroundColor: '#1a2e1a',
        };
      case 'error':
        return {
          ...baseStyle,
          borderColor: '#ef4444',
          backgroundColor: '#2e1a1a',
        };
      case 'warning':
        return {
          ...baseStyle,
          borderColor: '#fbbf24',
          backgroundColor: '#2e2a1a',
        };
      case 'info':
        return {
          ...baseStyle,
          borderColor: '#60a5fa',
          backgroundColor: '#1a1e2e',
        };
      default:
        return baseStyle;
    }
  };

  const getIcon = (): string => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '';
    }
  };

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    fontFamily: PIXEL_FONT,
    padding: '4px 8px',
    lineHeight: '1',
    opacity: 0.7,
  };

  const errorCodeStyle: React.CSSProperties = {
    fontSize: isMobile ? '11px' : '12px',
    color: '#aaa',
    marginTop: '6px',
    fontFamily: PIXEL_FONT,
    opacity: 0.8,
  };

  return (
    <div style={getToastStyle()}>
      <button
        style={closeButtonStyle}
        onClick={() => onClose(toast.id)}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
      >
        ✕
      </button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: isMobile ? '16px' : '18px', lineHeight: '1' }}>
          {getIcon()}
        </span>
        <div style={{ flex: 1 }}>
          <div>{toast.message}</div>
          {toast.errorCode && (
            <div style={errorCodeStyle}>
              Código: {toast.errorCode}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

