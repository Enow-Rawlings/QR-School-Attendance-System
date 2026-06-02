'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function StudentNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user || user.role !== 'student') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-lg">
            QR Attendance
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
