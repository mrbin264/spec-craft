'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const router = useRouter();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === e.ctrlKey;
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === e.metaKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === e.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === e.altKey;
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
        
        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, router]);
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  SEARCH: { key: 'k', metaKey: true, description: 'Search' },
  NEW_SPEC: { key: 'n', metaKey: true, description: 'New Spec' },
  DASHBOARD: { key: 'd', metaKey: true, shiftKey: true, description: 'Dashboard' },
  MY_SPECS: { key: 'm', metaKey: true, shiftKey: true, description: 'My Specs' },
  RECENT: { key: 'r', metaKey: true, shiftKey: true, description: 'Recent' },
  SAVE: { key: 's', metaKey: true, description: 'Save' },
  HELP: { key: '?', shiftKey: true, description: 'Help' },
};
