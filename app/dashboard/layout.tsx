'use client';

import { SidebarNavigation } from '@/components/sidebar-navigation';
import { BreadcrumbNavigation } from '@/components/breadcrumb-navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNavigation />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            <BreadcrumbNavigation />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
