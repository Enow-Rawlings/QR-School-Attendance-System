'use client';

import { useAuth } from '@/hooks/useAuth';
import { StudentNav } from '@/components/StudentNav';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import type { Course } from '@/lib/db';

interface CourseWithActiveSession extends Course {
  activeSession?: {
    id: string;
    course_id: string;
    status: string;
    closes_at: string;
  } | null;
}

export default function StudentDashboard() {
  const { user, updateUser } = useAuth();
  const [courses, setCourses] = useState<CourseWithActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions/student');
        if (!response.ok) throw new Error('Failed to fetch courses');

        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    const fetchSummary = async () => {
      try {
        const res = await fetch('/api/students/attendance-summary');
        if (!res.ok) return;
        const data = await res.json();
        const map: Record<string, number> = {};
        (data.summary || []).forEach((s: any) => (map[s.course_id] = s.total));
        setAttendanceMap(map);
      } catch {
        // ignore
      }
    };

    const fetchDeps = async () => {
      try {
        const r = await fetch('/api/admin/departments');
        if (!r.ok) return;
        const d = await r.json();
        setDepartments(d.departments || []);
      } catch {
        // ignore
      }
    };

    fetchSummary();
    fetchDeps();

    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveProfile = async () => {
    setSaveError('');
    setSaveSuccess('');

    if (!profile?.full_name?.trim()) {
      setSaveError('Full name is required');
      toast({
        title: 'Invalid profile',
        description: 'Please enter your name before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (!profile?.student_id?.trim()) {
      setSaveError('Student ID is required');
      toast({
        title: 'Invalid profile',
        description: 'Please enter your student ID before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (!profile?.department?.trim()) {
      setSaveError('Department is required');
      toast({
        title: 'Invalid profile',
        description: 'Please select a department before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(profile),
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      const updatedUser = data.user;
      setEditing(false);
      setProfile(updatedUser);
      updateUser(updatedUser);
      setSaveSuccess('Profile saved successfully.');
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved without reloading the page.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setSaveError(message);
      toast({
        title: 'Save failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const sortedCourses = [...courses].sort((a, b) => {
    const aActive = a.activeSession?.status === 'active';
    const bActive = b.activeSession?.status === 'active';
    if (aActive === bActive) return a.code.localeCompare(b.code);
    return aActive ? -1 : 1;
  });

  if (loading) {
    return <p className="text-muted-foreground">Loading sessions...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <StudentNav />
      <div className="relative overflow-hidden pb-16">
        <div className="pointer-events-none absolute left-0 top-20 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-2xl shadow-slate-950/20">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Student Dashboard</p>
                  <h1 className="mt-4 text-4xl font-semibold text-white">Welcome back, {(user as any)?.full_name || 'Student'}</h1>
                  <p className="mt-3 max-w-2xl text-slate-300">View your active sessions, update your profile, and stay on top of attendance with a modern student experience.</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
                  <p className="text-slate-400">Department</p>
                  <p className="mt-2 font-semibold text-white">{(user as any)?.department || '-'}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Card className="glass border-white/10 bg-white/5 p-6">
                  <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-400">Student ID</CardTitle>
                  <p className="mt-3 text-3xl font-semibold text-white">{(user as any)?.student_id || '-'}</p>
                </Card>
                <Card className="glass border-white/10 bg-white/5 p-6">
                  <CardTitle className="text-sm uppercase tracking-[0.2em] text-slate-400">Level</CardTitle>
                  <p className="mt-3 text-3xl font-semibold text-white">{(user as any)?.level || '-'}</p>
                </Card>
              </div>
            </div>

            <div className="glass rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Profile</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Edit your account</h2>
                </div>
                <Button
                  variant={editing ? 'secondary' : 'default'}
                  onClick={() => {
                    setEditing(!editing);
                    setSaveError('');
                    setSaveSuccess('');
                    setProfile(
                      profile || {
                        full_name: (user as any)?.full_name || '',
                        student_id: (user as any)?.student_id || '',
                        department: (user as any)?.department || '',
                      },
                    );
                  }}
                >
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              {editing ? (
                <div className="mt-6 space-y-4">
                  {saveError && (
                    <Alert variant="destructive">
                      <AlertDescription>{saveError}</AlertDescription>
                    </Alert>
                  )}
                  {saveSuccess && (
                    <Alert>
                      <AlertDescription>{saveSuccess}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-3">
                    <label className="block text-sm text-slate-300">Full name</label>
                    <input
                      className="w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      value={profile?.full_name || ''}
                      onChange={(e) => setProfile((p:any) => ({ ...p, full_name: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm text-slate-300">Student ID</label>
                    <input
                      className="w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      value={profile?.student_id || ''}
                      onChange={(e) => setProfile((p:any) => ({ ...p, student_id: e.target.value }))}
                      placeholder="Student ID"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm text-slate-300">Department</label>
                    <select
                      className="w-full rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                      value={profile?.department || ''}
                      onChange={(e) => setProfile((p:any) => ({ ...p, department: e.target.value }))}
                    >
                      <option value="" disabled>
                        Select department
                      </option>
                      {departments.map((d) => (
                        <option key={d} value={d} className="bg-slate-900 text-white">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-3 text-slate-300">
                  <p>{(user as any)?.full_name}</p>
                  <p>{(user as any)?.student_id}</p>
                  <p>{(user as any)?.department}</p>
                </div>
              )}
            </div>
          </div>

          <section className="mt-10 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">My Sessions</h2>
                <p className="mt-2 text-slate-400">Courses you are enrolled in</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {courses.length === 0 ? (
              <Card className="glass border-white/10 bg-white/5">
                <CardContent className="py-10 text-center text-slate-300">
                  No courses found for your department and level yet. Check with your administrator.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sortedCourses.map((course) => {
                  const activeSession = course.activeSession;
                  const isActive = activeSession?.status === 'active';
                  return (
                    <Card
                      key={course.id}
                      className={`glass border-white/10 bg-white/5 ${isActive ? 'border-emerald-500/20 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]' : ''}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg">{course.code}</CardTitle>
                            <CardDescription>{course.name}</CardDescription>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-500/15 text-slate-200'}`}>
                            {isActive ? 'Open for attendance' : 'No active session'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-slate-400">
                          {course.day_of_week} • {course.start_time} - {course.end_time}
                        </div>
                        <div className="text-sm text-slate-300">Attendance count: {attendanceMap[course.id] ?? 0}</div>
                        {isActive && activeSession && (
                          <Link href={`/attend/${activeSession.id}`}>
                            <Button className="w-full">Mark Attendance</Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
