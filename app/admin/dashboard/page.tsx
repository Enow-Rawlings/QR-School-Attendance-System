'use client';

import { useAuth } from '@/hooks/useAuth';
import { AdminNav } from '@/components/AdminNav';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    classes: 0,
    lecturers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [coursesRes, classesRes, lecturersRes] = await Promise.all([
          fetch('/api/admin/courses'),
          fetch('/api/admin/classes'),
          fetch('/api/admin/lecturers'),
        ]);

        if (coursesRes.ok) {
          const data = await coursesRes.json();
          setStats((prev) => ({ ...prev, courses: data.courses?.length || 0 }));
        }

        if (classesRes.ok) {
          const data = await classesRes.json();
          setStats((prev) => ({ ...prev, classes: data.classes?.length || 0 }));
        }

        if (lecturersRes.ok) {
          const data = await lecturersRes.json();
          setStats((prev) => ({ ...prev, lecturers: data.lecturers?.length || 0 }));
        }
      } catch (error) {
        console.error('[v0] Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <AdminNav />
      <div className="relative overflow-hidden pb-16">
        <div className="pointer-events-none absolute right-0 top-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-2xl shadow-slate-950/20">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Administrator</p>
              <h1 className="mt-4 text-4xl font-semibold text-white">Welcome back, {user?.email}</h1>
              <p className="mt-4 max-w-2xl text-slate-300">
                Manage courses, classes, lecturers and assignments from a polished dashboard with quick access to key administrative workflows.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link href="/admin/lecturers" className="w-full">
                  <Button className="w-full">Create Lecturer</Button>
                </Link>
                <Link href="/admin/assignments" className="w-full">
                  <Button variant="secondary" className="w-full">
                    Assign Courses
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 justify-items-center items-start">
              <Card className="glass border-white/10 bg-white/5 p-6 max-w-sm w-full mx-auto h-full">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Courses</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-semibold text-white">{loading ? '-' : stats.courses}</div>
                  <p className="mt-2 text-sm text-slate-400">Active course listings</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/10 bg-white/5 p-6 max-w-sm w-full mx-auto h-full">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Classes</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-semibold text-white">{loading ? '-' : stats.classes}</div>
                  <p className="mt-2 text-sm text-slate-400">Academic levels setup</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/10 bg-white/5 p-6 max-w-sm w-full mx-auto h-full">
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Lecturers</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-semibold text-white">{loading ? '-' : stats.lecturers}</div>
                  <p className="mt-2 text-sm text-slate-400">Registered instructors</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Link href="/admin/courses" className="group block h-full">
              <Card className="glass h-full border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/10">
                <CardHeader>
                  <CardTitle>Manage Courses</CardTitle>
                  <CardDescription>Create and edit course schedules.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-slate-300 group-hover:text-white">Use this section to add or update course information and ensure all schedules are accurate.</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/classes" className="group block h-full">
              <Card className="glass h-full border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/10">
                <CardHeader>
                  <CardTitle>Manage Classes</CardTitle>
                  <CardDescription>Build academic class groups.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-slate-300 group-hover:text-white">Quickly add new class groups and maintain department-level structure for student enrollment.</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/lecturers" className="group block h-full">
              <Card className="glass h-full border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/10">
                <CardHeader>
                  <CardTitle>Lecturer Roster</CardTitle>
                  <CardDescription>Provision lecturer accounts.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-slate-300 group-hover:text-white">Create secure lecturer accounts and keep instructor access separate from the student registration flow.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
