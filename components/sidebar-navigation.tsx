'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  shortcut?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', shortcut: 'd' },
  { name: 'My Specs', href: '/dashboard?filter=mine', icon: '📝', shortcut: 'm' },
  { name: 'Recent', href: '/dashboard?filter=recent', icon: '🕐', shortcut: 'r' },
];

export function SidebarNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + Shift + key
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        const item = navItems.find((item) => item.shortcut === e.key.toLowerCase());
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
      }
      
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search input if on dashboard
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
      
      // Cmd/Ctrl + N for new spec
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        // Trigger create button click
        const event = new CustomEvent('create-spec');
        window.dispatchEvent(event);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
  
  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold">SpecCraft</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </span>
              {item.shortcut && (
                <kbd className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                  ⌘⇧{item.shortcut.toUpperCase()}
                </kbd>
              )}
            </button>
          );
        })}
      </nav>
      
      {/* User Info */}
      {user && (
        <div className="border-t border-gray-800 p-4">
          <div className="mb-2 text-sm">
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-gray-400">{user.role}</div>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-md bg-gray-800 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            Logout
          </button>
        </div>
      )}
      
      {/* Keyboard Shortcuts Help */}
      <div className="border-t border-gray-800 p-4 text-xs text-gray-400">
        <div className="mb-2 font-medium">Keyboard Shortcuts</div>
        <div className="space-y-1">
          <div>⌘K - Search</div>
          <div>⌘N - New Spec</div>
          <div>⌘⇧D - Dashboard</div>
        </div>
      </div>
    </div>
  );
}
