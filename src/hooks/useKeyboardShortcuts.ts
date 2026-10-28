import { useEffect, useCallback } from 'react';

interface KeyboardShortcutHandlers {
  onToggleTimer: () => void;
  onReset: () => void;
  onSkip: () => void;
  onToggleTheme: () => void;
}

export default function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlers.onToggleTimer();
          break;
        case 'KeyR':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handlers.onReset();
          }
          break;
        case 'KeyS':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handlers.onSkip();
          }
          break;
        case 'KeyD':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            handlers.onToggleTheme();
          }
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
