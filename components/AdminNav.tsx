'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AdminNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user || user.role !== 'admin') {
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
          <Link href="/admin/dashboard" className="font-bold text-lg text-white">
            QR Attendance
          </Link>
          <div className="flex gap-4">
            <Link href="/admin/dashboard" className="text-sm text-slate-200 hover:text-cyan-300">
              Dashboard
            </Link>
            <Link href="/admin/courses" className="text-sm text-slate-200 hover:text-cyan-300">
              Courses
            </Link>
            <Link href="/admin/classes" className="text-sm text-slate-200 hover:text-cyan-300">
              Classes
            </Link>
            <Link href="/admin/lecturers" className="text-sm text-slate-200 hover:text-cyan-300">
              Lecturers
            </Link>
            <Link href="/admin/assignments" className="text-sm text-slate-200 hover:text-cyan-300">
              Assignments
            </Link>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
        >
          Logout
        </Button>
      </div>
    </nav>
  );
}
