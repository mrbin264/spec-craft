'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function UserProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'PM':
        return 'bg-purple-100 text-purple-800';
      case 'TA':
        return 'bg-blue-100 text-blue-800';
      case 'Dev':
        return 'bg-green-100 text-green-800';
      case 'QA':
        return 'bg-yellow-100 text-yellow-800';
      case 'Stakeholder':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'PM':
        return 'Product Manager';
      case 'TA':
        return 'Technical Architect';
      case 'Dev':
        return 'Developer';
      case 'QA':
        return 'QA Engineer';
      case 'Stakeholder':
        return 'Stakeholder';
      default:
        return role;
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{user.name}</p>
        <p className="text-xs text-gray-500">{user.email}</p>
      </div>
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(
          user.role
        )}`}
      >
        {getRoleLabel(user.role)}
      </span>
      <button
        onClick={handleLogout}
        className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Logout
      </button>
    </div>
  );
}
