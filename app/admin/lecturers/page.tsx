'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdminNav } from '@/components/AdminNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/lib/db';

export default function AdminLecturersPage() {
  const { user } = useAuth();
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const res = await fetch('/api/admin/lecturers');
        if (!res.ok) throw new Error('Failed to fetch lecturers');
        const data = await res.json();
        setLecturers(data.lecturers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lecturers');
      } finally {
        setLoading(false);
      }
    };

    fetchLecturers();
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/admin/departments');
        if (!res.ok) return;
        const data = await res.json();
        // support both { departments: string[] } and { groupedDepartments: [{ departments: [{ department }] }] }
        let flat: string[] = [];
        if (Array.isArray(data.departments)) {
          flat = data.departments;
        } else if (Array.isArray(data.groupedDepartments)) {
          flat = data.groupedDepartments.flatMap((g: any) => (g.departments || []).map((d: any) => d.department));
        }
        setDepartments(flat || []);
        if ((flat || []).length > 0 && !form.department) {
          setForm((prev) => ({ ...prev, department: (flat || [])[0] }));
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email.trim() || !form.full_name.trim() || !form.department.trim() || !form.password.trim()) {
      setError('All fields are required.');
      toast({
        title: 'Missing information',
        description: 'Please complete all lecturer fields before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      toast({
        title: 'Invalid password',
        description: 'Choose a stronger password with at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      toast({
        title: 'Password mismatch',
        description: 'Please make sure both password fields match.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/admin/lecturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          full_name: form.full_name,
          department: form.department,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create lecturer account');
      }

      setSuccess('Lecturer account created successfully.');
      toast({
        title: 'Lecturer created',
        description: 'The lecturer account has been added successfully.',
      });
      setForm({ email: '', full_name: '', department: '', password: '', confirmPassword: '' });
      setLecturers((prev) => [...prev, data.lecturer]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      toast({
        title: 'Create failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <AdminNav />
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-32 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
              <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-2xl shadow-slate-950/30">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Admin Workspace</p>
                    <h1 className="mt-3 text-4xl font-semibold text-white">Lecturer Accounts</h1>
                    <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                      Create lecturer accounts securely and manage the existing instructor roster. Lecturer login is only allowed after admin provisioning.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
                    <p className="font-semibold text-white">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="glass border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Create Lecturer</CardTitle>
                    <CardDescription>Add a new lecturer account via the secure admin endpoint.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {error && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    {success && (
                      <Alert className="mb-4 border-green-600 bg-green-50 text-green-700">
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">Email</label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(event) => handleChange('email', event.target.value)}
                          placeholder="lecturer@lmu.edu.cm"
                          disabled={saving}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">Full name</label>
                        <Input
                          type="text"
                          value={form.full_name}
                          onChange={(event) => handleChange('full_name', event.target.value)}
                          placeholder="Dr. Jane Doe"
                          disabled={saving}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">Department</label>
                        <select
                          value={form.department}
                          onChange={(event) => handleChange('department', event.target.value)}
                          disabled={saving || departments.length === 0}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="" disabled>
                            {departments.length === 0 ? 'Loading departments...' : 'Select department'}
                          </option>
                          {departments.map((department) => (
                            <option key={department} value={department} className="bg-slate-900 text-white">
                              {department}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-200">Password</label>
                          <Input
                            type="password"
                            value={form.password}
                            onChange={(event) => handleChange('password', event.target.value)}
                            placeholder="••••••••"
                            disabled={saving}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-200">Confirm password</label>
                          <Input
                            type="password"
                            value={form.confirmPassword}
                            onChange={(event) => handleChange('confirmPassword', event.target.value)}
                            placeholder="••••••••"
                            disabled={saving}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={saving}>
                        {saving ? 'Creating lecturer...' : 'Create Lecturer'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="glass border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Guide</CardTitle>
                    <CardDescription>Best practices for lecturer account creation.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-slate-300">
                    <p>
                      Lecturer accounts should be created by administrators only. This prevents students from registering as instructors and keeps access separate.
                    </p>
                    <ul className="space-y-3 list-disc pl-5">
                      <li>Use official university email addresses.</li>
                      <li>Choose a strong password and share login details securely.</li>
                      <li>Assign lecturers to courses using the admin assignments page.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <div className="glass rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-white">Lecturer roster</CardTitle>
                    <CardDescription className="text-slate-300">
                      Existing lecturer accounts are listed below for review.
                    </CardDescription>
                  </div>
                  <div className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-200">
                    {lecturers.length} lecturer{lecturers.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {loading ? (
                  <Card className="glass border-white/10 bg-white/5">
                    <CardContent>
                      <p className="text-slate-300">Loading lecturers...</p>
                    </CardContent>
                  </Card>
                ) : lecturers.length === 0 ? (
                  <Card className="glass border-white/10 bg-white/5">
                    <CardContent>
                      <p className="text-slate-300">No lecturer accounts found yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  lecturers.map((lecturer) => (
                    <Card key={lecturer.id} className="glass border-white/10 bg-white/5">
                      <CardContent className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <p className="text-sm text-slate-400">{lecturer.full_name}</p>
                          <p className="font-medium text-white">{lecturer.email}</p>
                          <p className="text-sm text-slate-400">{lecturer.department}</p>
                        </div>
                        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
                          Lecturer
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
