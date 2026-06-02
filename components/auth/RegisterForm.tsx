'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Lock, Mail, User, BookOpen, Building2 } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    student_id: '',
    level: 'Level 200',
    department: '',
  });
  const role = 'student' as const;
  const [departments, setDepartments] = useState<string[]>([]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        role,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        student_id: formData.student_id,
        level: formData.level,
        department: formData.department,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push(role === 'student' ? '/dashboard' : '/lecturer/dashboard');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/admin/departments');
        if (!res.ok) return;
        const data = await res.json();
        // API may return groupedDepartments (by level) or a simple departments array.
        let flat: string[] = [];
        if (Array.isArray(data.departments)) {
          flat = data.departments;
        } else if (Array.isArray(data.groupedDepartments)) {
          flat = data.groupedDepartments.flatMap((g: any) => (g.departments || []).map((d: any) => d.department));
        }
        setDepartments(flat || []);
        if ((flat || []).length > 0 && !formData.department) {
          setFormData((prev) => ({ ...prev, department: (flat || [])[0] }));
        }
      } catch (err) {
        // ignore
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4 animate-bounce-in">
          <User className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-300">Join the attendance system</p>
      </div>

      {/* Main Card */}
      <div className="glass rounded-2xl p-8 border border-white/20 animate-scale-in">
        <div className="space-y-5 animate-fade-in">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-gray-300">
            <p className="font-semibold text-white">Student registration only</p>
            <p className="mt-2">
              Lecturer accounts are provisioned by administrators. If you are a lecturer, please ask an administrator to create your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="animate-slide-in-up bg-red-500/20 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="animate-slide-in-up bg-green-500/20 border-green-500/50">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">{success}</AlertDescription>
              </Alert>
            )}

            <FormField
              label="Email Address"
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="student@lmu.edu.cm"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading}
              helperText="Your university email address"
            />

            <FormField
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              disabled={loading}
            />

            <FormField
              label="Student ID"
              icon={<BookOpen className="w-4 h-4" />}
              type="text"
              placeholder="STU123456"
              value={formData.student_id}
              onChange={(e) => handleChange('student_id', e.target.value)}
              disabled={loading}
              helperText="Your unique student identification number"
            />

            <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '150ms' }}>
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                Academic Level
              </label>
              <select
                className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-4 py-2 focus:border-cyan-400 focus:bg-white/15 transition-smooth disabled:opacity-50"
                value={formData.level}
                onChange={(e) => handleChange('level', e.target.value)}
                disabled={loading}
              >
                <option className="bg-slate-900">Level 200</option>
                <option className="bg-slate-900">Level 300</option>
                <option className="bg-slate-900">Level 400</option>
                <option className="bg-slate-900">Masters Year 1</option>
                <option className="bg-slate-900">Masters Year 2</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Department
              </label>
              {departments.length === 0 ? (
                <div className="text-xs text-yellow-300">No departments available yet. Contact your administrator.</div>
              ) : (
                <select
                  className="w-full rounded-lg bg-white/10 border border-white/20 text-white px-4 py-2 focus:border-cyan-400 focus:bg-white/15 transition-smooth disabled:opacity-50"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  disabled={loading}
                  required
                >
                  {departments.map((d) => (
                    <option key={d} value={d} className="bg-slate-900">
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <FormField
              label="Password"
              icon={<Lock className="w-4 h-4" />}
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={loading}
              helperText="Minimum 8 characters"
            />

            <FormField
              label="Confirm Password"
              icon={<Lock className="w-4 h-4" />}
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              disabled={loading || departments.length === 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 rounded-xl transition-smooth disabled:opacity-50 animate-slide-in-right"
              style={{ animationDelay: '200ms' }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </div>
              ) : (
                'Create Student Account'
              )}
            </Button>
          </form>
        </div>



        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Link */}
        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-smooth">
            Sign in
          </a>
        </p>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 animate-slide-in-up" style={{ animationDelay: '250ms' }}>
        <p className="text-xs text-gray-400 text-center">
          By registering, you agree to our{' '}
          <a href="/eula" className="text-cyan-400 hover:text-cyan-300 underline">
            Privacy Policy & Terms
          </a>
        </p>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
  helperText?: string;
}

function FormField({
  label,
  icon,
  type,
  placeholder,
  value,
  onChange,
  disabled,
  helperText,
}: FormFieldProps) {
  return (
    <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '100ms' }}>
      <label className="text-sm font-semibold text-white flex items-center gap-2">
        <span className="text-cyan-400">{icon}</span>
        {label}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required
        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:bg-white/15 transition-smooth"
      />
      {helperText && <p className="text-xs text-gray-400">{helperText}</p>}
    </div>
  );
}
