'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/components/AuthProvider';
import { Toaster } from '@/components/ui/toaster';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    try {
      const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
      if (!isMobile) return;

      // Dynamically load Eruda from CDN for mobile debugging only
      const existing = document.getElementById('eruda-script');
      if (existing) return;

      const script = document.createElement('script');
      script.id = 'eruda-script';
      script.src = 'https://cdn.jsdelivr.net/npm/eruda';
      script.async = true;
      script.onload = () => {
        try {
          // @ts-ignore - eruda attaches to window
          if (window.eruda && !window.eruda.get) {
            // older eruda versions expose init directly
            window.eruda.init && window.eruda.init();
          } else if (window.eruda) {
            window.eruda.init && window.eruda.init();
          }
        } catch (e) {
          // ignore
        }
      };
      document.body.appendChild(script);
    } catch (e) {
      // ignore errors during optional debug loader
    }
  }, []);

  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
