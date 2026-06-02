'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function LecturerNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user || user.role !== 'lecturer') {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <nav className="border-b border-white/10 bg-slate-950/90 text-white backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/lecturer/dashboard" className="font-bold text-lg text-white">
            QR Attendance
          </Link>
          <div className="flex gap-4">
            <Link href="/lecturer/dashboard" className="text-sm text-slate-200 hover:text-cyan-300">
              Dashboard
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-200">{user.email}</span>
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
