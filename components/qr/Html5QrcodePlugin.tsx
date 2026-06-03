'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Html5QrcodePluginProps {
  onScanSuccess: (decodedText: string) => void;
  onError?: (message: string) => void;
}

export default function Html5QrcodePlugin({ onScanSuccess, onError }: Html5QrcodePluginProps) {
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrcodeRegion = document.getElementById('html5qr-code-full-region');
    if (!qrcodeRegion) {
      console.error('[v0] QR code region not found');
      return;
    }

    const html5QrCode = new Html5Qrcode('html5qr-code-full-region');
    qrRef.current = html5QrCode;
    let isStopped = false;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (isStopped) return;

        const cameraId = cameras && cameras.length > 0 ? cameras[0].id : undefined;
        const cameraConfig = cameraId ? cameraId : { facingMode: 'environment' };

        await html5QrCode.start(
          cameraConfig,
          config,
          (decodedText) => {
            if (isStopped) return;
            onScanSuccess(decodedText);
            html5QrCode.stop().catch(() => {
              // Ignore stop errors after success
            });
          },
          () => {
            // continue scanning on errors
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (onError) {
          onError(message);
        } else {
          console.error('[v0] QR scanner error:', err);
        }
      }
    };

    startScanner();

    return () => {
      isStopped = true;
      html5QrCode.stop().catch(() => {
        // Cleanup
      });
    };
  }, [onScanSuccess]);

  return (
    <div id="html5qr-code-full-region" style={{ width: '100%', minHeight: '300px' }} />
  );
}
