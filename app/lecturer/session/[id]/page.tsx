'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });
import { useParams, useRouter } from 'next/navigation';

interface Attendance {
  id: string;
  student_id: string;
  users?: { full_name: string; student_id: string };
  marked_at: string;
  photo_url?: string;
}

export default function SessionMonitor() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions?id=${sessionId}`);
        if (!response.ok) throw new Error('Session not found');

        const data = await response.json();
        setSession(data.session);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Poll attendance every 2 seconds
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/attendance?session_id=${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setAttendance(data.attendance || []);
        }
      } catch (err) {
        console.error('[v0] Failed to fetch attendance:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session, sessionId]);

  // Refresh QR every 15 seconds and update time remaining
  useEffect(() => {
    if (!session) return;

    const refreshQR = async () => {
      try {
        const response = await fetch('/api/sessions/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (response.ok) {
          const data = await response.json();
          setSession((prev: any) => ({
            ...prev,
            qr_token: data.qr_token,
            pin_code: data.pin_code,
          }));
        }
      } catch (err) {
        console.error('[v0] QR refresh failed:', err);
      }
    };

    const updateTime = () => {
      if (session?.closes_at) {
        const remaining = new Date(session.closes_at).getTime() - Date.now();
        if (remaining > 0) {
          const mins = Math.floor(remaining / 60000);
          const secs = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining(`${mins}:${String(secs).padStart(2, '0')}`);
        } else {
          setTimeRemaining('Closed');
        }
      }
    };

    const qrInterval = setInterval(refreshQR, 15000);
    const timeInterval = setInterval(updateTime, 1000);
    updateTime();
    setLoading(false);

    return () => {
      clearInterval(qrInterval);
      clearInterval(timeInterval);
    };
  }, [session, sessionId]);

  const handleCloseSession = async () => {
    setClosing(true);
    try {
      const response = await fetch('/api/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) throw new Error('Failed to close session');

      router.push('/lecturer/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close session');
      setClosing(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading session...</p>;
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Session not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/lecturer/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Monitor</h1>
          <p className="text-muted-foreground mt-2">Time remaining: {timeRemaining}</p>
        </div>
        <Button
          onClick={handleCloseSession}
          disabled={closing}
          variant="outline"
        >
          {closing ? 'Closing...' : 'Close Session'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Refreshes every 15 seconds</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {session?.qr_token && (
              <div className="border rounded-lg p-2 bg-white">
                <QRCode value={session.qr_token} size={256} />
              </div>
            )}
            <div className="w-full text-center">
              <p className="text-sm text-muted-foreground mb-2">PIN Code</p>
              <p className="text-4xl font-bold tracking-widest">{session?.pin_code}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Attendance ({attendance.length})</CardTitle>
            <CardDescription>Students who have marked attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Waiting for students to mark attendance...
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-semibold">Student Name</th>
                      <th className="text-left py-2 px-2 font-semibold">Student ID</th>
                      <th className="text-left py-2 px-2 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-2">{record.users?.full_name || 'Unknown'}</td>
                        <td className="py-2 px-2 font-mono text-xs">{record.users?.student_id}</td>
                        <td className="py-2 px-2 text-muted-foreground text-xs">
                          {new Date(record.marked_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
