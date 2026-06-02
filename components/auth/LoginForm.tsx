'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();

      // Redirect based on role
      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (data.user.role === 'lecturer') {
        router.push('/lecturer/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = email.includes('@') && email.includes('.');

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl mb-4 animate-bounce-in">
          <Lock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-gray-300">Sign in to your attendance account</p>
      </div>

      {/* Main Form Card */}
      <div className="glass rounded-2xl p-8 border border-white/20 animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="animate-slide-in-up bg-red-500/20 border-red-500/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '100ms' }}>
            <label htmlFor="email" className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              Email Address
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="student@lmu.edu.cm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="pl-4 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:bg-white/15 transition-smooth"
              />
              {isValidEmail && (
                <CheckCircle className="absolute right-3 top-3 w-5 h-5 text-cyan-400" />
              )}
            </div>
            <p className="text-xs text-gray-400">Enter your university email address</p>
          </div>

          {/* Password Field */}
          <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '150ms' }}>
            <label htmlFor="password" className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="pl-4 pr-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:bg-white/15 transition-smooth"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-cyan-400 transition-smooth"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400">Use the password provided by your administrator</p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 rounded-xl transition-smooth disabled:opacity-50 disabled:cursor-not-allowed animate-slide-in-right"
            style={{ animationDelay: '200ms' }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Links */}
        <div className="space-y-3 text-center text-sm">
          <div>
            <p className="text-gray-400 mb-2">New to the system?</p>
            <a
              href="/eula"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 hover:text-cyan-300 transition-smooth border border-white/10"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 animate-slide-in-up" style={{ animationDelay: '250ms' }}>
        <p className="text-xs text-gray-400 text-center">
          <span className="font-semibold text-cyan-400">Landmark Metropolitan University of Buea</span>
          <br />
          QR-based Attendance System v1.0
        </p>
      </div>
    </div>
  );
}
