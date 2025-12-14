'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">Portfolio Manager</h1>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">
              {user.firstName} {user.lastName} ({user.role})
            </span>
          )}
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
