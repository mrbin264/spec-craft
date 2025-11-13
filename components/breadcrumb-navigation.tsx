'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function BreadcrumbNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  
  useEffect(() => {
    if (!pathname) return;
    
    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: 'Home', href: '/dashboard' }];
    
    let currentPath = '';
    for (let i = 0; i < segments.length; i++) {
      currentPath += `/${segments[i]}`;
      
      // Map segments to readable labels
      let label = segments[i];
      if (label === 'dashboard') {
        label = 'Dashboard';
      } else if (label === 'specs') {
        label = 'Specs';
      } else if (label === 'login') {
        label = 'Login';
      } else if (label === 'register') {
        label = 'Register';
      } else if (label === 'editor-demo') {
        label = 'Editor Demo';
      } else if (label.length === 24) {
        // Likely a MongoDB ObjectId - fetch spec title
        label = 'Loading...';
        fetchSpecTitle(label, currentPath);
      }
      
      items.push({ label, href: currentPath });
    }
    
    setBreadcrumbs(items);
  }, [pathname]);
  
  async function fetchSpecTitle(specId: string, path: string) {
    try {
      const response = await fetch(`/api/specs/${specId}`);
      if (response.ok) {
        const data = await response.json();
        setBreadcrumbs((prev) =>
          prev.map((item) =>
            item.href === path ? { ...item, label: data.spec.title } : item
          )
        );
      }
    } catch (error) {
      console.error('Error fetching spec title:', error);
    }
  }
  
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <span className="mx-2 text-gray-400">/</span>}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-gray-900">{item.label}</span>
          ) : (
            <button
              onClick={() => router.push(item.href)}
              className="hover:text-gray-900 hover:underline"
            >
              {item.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
