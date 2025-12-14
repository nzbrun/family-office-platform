'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold">Portfolio Manager</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === '/' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/assistant"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === '/assistant' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              Assistant
            </Link>
          </div>
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
