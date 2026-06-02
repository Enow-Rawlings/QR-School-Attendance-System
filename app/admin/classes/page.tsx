'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ClassForm } from '@/components/admin/ClassForm';
import { ClassesList } from '@/components/admin/ClassesList';
import { AdminNav } from '@/components/AdminNav';

export default function ClassesPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);

  if (!user || user.role !== 'admin') {
    return <p className="text-red-600">Unauthorized</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <AdminNav />
      <div className="relative overflow-hidden pb-16">
        <div className="pointer-events-none absolute right-0 top-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Manage Classes</h1>
              <p className="text-slate-300 mt-2">Create and view all classes by academic level</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ClassForm onSuccess={() => setRefresh((prev) => prev + 1)} />
              </div>

              <div className="lg:col-span-2">
                <ClassesList refresh={refresh} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
