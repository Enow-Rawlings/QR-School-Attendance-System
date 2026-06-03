'use client';

import { useAuth } from '@/hooks/useAuth';
import { LecturerNav } from '@/components/LecturerNav';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Course } from '@/lib/db';

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingSession, setStartingSession] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses/my-courses');
        if (!response.ok) throw new Error('Failed to fetch courses');

        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleStartSession = async (courseId: string) => {
    setStartingSession(courseId);
    setSessionError('');

    try {
      // Get the user's timezone offset (in minutes)
      const timezoneOffset = -new Date().getTimezoneOffset();

      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          course_id: courseId,
          timezoneOffset: timezoneOffset,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to start session');
      }

      window.location.href = `/lecturer/session/${result.session.id}`;
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setStartingSession(null);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <LecturerNav />
      <div className="relative overflow-hidden pb-16">
        <div className="pointer-events-none absolute right-0 top-16 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 bottom-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-2xl shadow-slate-950/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Lecturer Dashboard</p>
                <h1 className="mt-4 text-4xl font-semibold text-white">Hello, {(user as any)?.full_name || 'Lecturer'}</h1>
                <p className="mt-3 max-w-2xl text-slate-300">Manage your course sessions and start attendance for your assigned classes.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
                <p className="text-slate-400">Courses Assigned</p>
                <p className="mt-2 text-3xl font-semibold text-white">{courses.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {error && (
              <Card className="glass border-white/10 bg-white/5 col-span-full">
                <CardContent>
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
            {sessionError && (
              <Card className="glass border-white/10 bg-white/5 col-span-full">
                <CardContent>
                  <Alert variant="destructive">
                    <AlertDescription>{sessionError}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
            {courses.length === 0 ? (
              <Card className="glass border-white/10 bg-white/5 col-span-full">
                <CardContent className="py-10 text-center text-slate-300">
                  No courses assigned yet. Contact your administrator to assign your teaching schedule.
                </CardContent>
              </Card>
            ) : (
              courses.map((course) => (
                <Card key={course.id} className="glass border-white/10 bg-white/5 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl">{course.code}</CardTitle>
                        <CardDescription>{course.name}</CardDescription>
                      </div>
                      <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                        {course.department}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-1 text-sm text-slate-400">
                      <p>Schedule</p>
                      <p className="text-white">
                        {course.schedule && course.schedule.length > 0
                          ? course.schedule.map((s) => `${s.day_of_week} ${s.start_time}-${s.end_time}`).join(', ')
                          : `${course.day_of_week} ${course.start_time}-${course.end_time}`}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm text-slate-400">
                      <p>Department</p>
                      <p className="text-white">{course.department || 'N/A'}</p>
                    </div>
                  </CardContent>
                  <div className="border-t border-white/10 p-6">
                    <Button
                      onClick={() => handleStartSession(course.id)}
                      disabled={startingSession === course.id}
                      className="w-full"
                    >
                      {startingSession === course.id ? 'Starting...' : 'Start Session'}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
