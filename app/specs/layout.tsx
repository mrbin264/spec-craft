'use client';

import { SidebarNavigation } from '@/components/sidebar-navigation';
import { BreadcrumbNavigation } from '@/components/breadcrumb-navigation';

export default function SpecsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNavigation />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-4 py-4">
          <BreadcrumbNavigation />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
