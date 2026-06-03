'use client';

import { useEffect, useRef } from 'react';

interface Html5QrcodePluginProps {
  onScanSuccess: (decodedText: string) => void;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    eruda?: any;
  }
}

export default function Html5QrcodePlugin({ onScanSuccess, onError }: Html5QrcodePluginProps) {
  const qrRef = useRef<any>(null);

  useEffect(() => {
    let html5QrCode: any;
    let isStopped = false;
    let scannerRunning = false;

    const qrcodeRegion = document.getElementById('html5qr-code-full-region');
    if (!qrcodeRegion) {
      console.error('[v0] QR code region not found');
      return;
    }

    const startScanner = async () => {
      try {
        const module = await import('html5-qrcode');
        const { Html5Qrcode } = module;
        if (isStopped) return;

        html5QrCode = new Html5Qrcode('html5qr-code-full-region');
        qrRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        const cameras = await Html5Qrcode.getCameras();
        if (isStopped) return;
        let cameraConfig: any = { facingMode: 'environment' };
        try {
          if (Array.isArray(cameras) && cameras.length > 0) {
            const preferredCamera = cameras.find((camera: any) =>
              /rear|back|environment/i.test(camera.label || ''),
            );
            const cameraId = preferredCamera?.id || cameras[0]?.id;
            cameraConfig = cameraId || { facingMode: 'environment' };
          }
        } catch (e) {
          // If anything goes wrong enumerating cameras, fallback to facingMode
          cameraConfig = { facingMode: 'environment' };
        }

        // If mediaDevices or getUserMedia not available, try to start with facingMode fallback
        if (!navigator?.mediaDevices?.getUserMedia) {
          cameraConfig = { facingMode: 'environment' };
        }

        await html5QrCode.start(
          cameraConfig,
          config,
          (decodedText: string) => {
            if (isStopped) return;
            onScanSuccess(decodedText);
            try {
              if (scannerRunning) {
                scannerRunning = false;
                html5QrCode.stop().catch(() => {
                  // Ignore stop errors after success
                });
              }
            } catch (e) {
              // ignore
            }
          },
          () => {
            // continue scanning on errors
          },
        );

        // mark scanner as running after successful start
        scannerRunning = true;
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
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {
          // Cleanup
        });
      }
    };
  }, [onScanSuccess, onError]);

  return (
    <div id="html5qr-code-full-region" style={{ width: '100%', minHeight: '300px' }} />
  );
}
