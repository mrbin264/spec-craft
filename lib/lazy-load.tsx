import dynamic from 'next/dynamic';
import { ComponentType, ReactElement } from 'react';

/**
 * Default loading component for lazy-loaded modules
 */
export function DefaultLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Helper to create lazy-loaded components with consistent loading UI
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    ssr?: boolean;
    loading?: () => ReactElement;
  }
) {
  return dynamic(importFn, {
    ssr: options?.ssr ?? false,
    loading: options?.loading ?? DefaultLoader,
  });
}

/**
 * Preload a lazy-loaded component
 * Useful for prefetching components before they're needed
 */
export function preloadComponent(
  importFn: () => Promise<any>
): void {
  // Trigger the import but don't wait for it
  importFn().catch(() => {
    // Silently fail - component will load when actually needed
  });
}
