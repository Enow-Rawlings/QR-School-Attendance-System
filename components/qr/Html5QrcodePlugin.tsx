'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Html5QrcodePluginProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function Html5QrcodePlugin({ onScanSuccess }: Html5QrcodePluginProps) {
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const qrcodeRegion = document.getElementById('html5qr-code-full-region');
    if (!qrcodeRegion) {
      console.error('[v0] QR code region not found');
      return;
    }

    // Create scanner instance
    const html5QrCode = new Html5Qrcode('html5qr-code-full-region');
    qrRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    html5QrCode
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScanSuccess(decodedText);
          html5QrCode.stop();
        },
        () => {
          // On error, continue scanning
        }
      )
      .catch((err) => {
        console.error('[v0] QR scanner error:', err);
      });

    return () => {
      html5QrCode.stop().catch(() => {
        // Cleanup
      });
    };
  }, [onScanSuccess]);

  return (
    <div id="html5qr-code-full-region" style={{ width: '100%', minHeight: '300px' }} />
  );
}
