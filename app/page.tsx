'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and redirect
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          // Redirect based on role
          if (data.user.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (data.user.role === 'lecturer') {
            router.push('/lecturer/dashboard');
          } else {
            router.push('/dashboard');
          }
        } else {
          // Not authenticated, go to login
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return null;
}
