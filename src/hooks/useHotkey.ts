import { useEffect } from 'react';

export function useHotkey(hotkey: string, callback: () => void) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Example: Cmd+I (Mac) or Ctrl+I (Win)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === hotkey.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hotkey, callback]);
} 