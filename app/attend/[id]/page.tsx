'use client';

import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Html5QrcodePlugin from '@/components/qr/Html5QrcodePlugin';

type Step = 'qr' | 'pin' | 'photo' | 'confirm' | 'success';

export default function AttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [step, setStep] = useState<Step>('qr');
  const [qrToken, setQrToken] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleQRScanned = (decodedText: string) => {
    setQrToken(decodedText);
    setStep('pin');
  };

  const handlePINSubmit = () => {
    if (pinCode.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setError('');
    setStep('photo');
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, 320, 240);
    const photoData = canvasRef.current.toDataURL('image/jpeg', 0.8);
    setPhoto(photoData);
    setStep('confirm');
  };

  const handleRetakePhoto = () => {
    setPhoto(null);
    setStep('photo');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          qr_token: qrToken,
          pin_code: pinCode,
          photo_base64: photo?.split(',')[1],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark attendance');
      }

      setStep('success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start camera when photo step is reached
    if (step === 'photo' && videoRef.current && !videoRef.current.srcObject) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          setError('Failed to access camera');
          console.error('[v0] Camera error:', err);
        });
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [step]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>
            {step === 'qr' && 'Scan the QR code'}
            {step === 'pin' && 'Enter the PIN'}
            {step === 'photo' && 'Take a photo'}
            {step === 'confirm' && 'Confirm attendance'}
            {step === 'success' && 'Success!'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'qr' && (
            <div className="space-y-4">
              <Html5QrcodePlugin onScanSuccess={handleQRScanned} />
              <p className="text-sm text-muted-foreground text-center">
                Point your camera at the QR code
              </p>
            </div>
          )}

          {step === 'pin' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">4-Digit PIN</label>
                <Input
                  type="text"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="0000"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="text-2xl tracking-widest text-center"
                  autoFocus
                />
              </div>
              <Button onClick={handlePINSubmit} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === 'photo' && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 object-cover"
                />
              </div>
              <canvas ref={canvasRef} width={320} height={240} className="hidden" />
              <Button onClick={handleCapturePhoto} className="w-full">
                Capture Photo
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              {photo && (
                <div className="rounded-lg overflow-hidden">
                  <img src={photo} alt="Captured" className="w-full h-64 object-cover" />
                </div>
              )}
              <div className="space-y-2">
                <Button onClick={handleSubmit} disabled={loading} className="w-full">
                  {loading ? 'Submitting...' : 'Confirm & Submit'}
                </Button>
                <Button onClick={handleRetakePhoto} variant="outline" className="w-full">
                  Retake Photo
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-8">
              <div className="text-5xl">✓</div>
              <p className="font-semibold text-green-600">Attendance marked successfully!</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
