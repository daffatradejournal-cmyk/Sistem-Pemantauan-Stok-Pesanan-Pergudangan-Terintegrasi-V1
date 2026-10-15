'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  onScan: (decodedText: string) => void;
  isScanningActive?: boolean;
}

export function BarcodeCameraScanner({ onScan, isScanningActive = true }: Props) {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const containerId = 'barcode-scanner-viewport';

  const startScanner = async () => {
    try {
      setErrorMsg(null);
      const { Html5Qrcode } = await import('html5-qrcode');

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {}
      }

      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 160 },
          aspectRatio: 1.777778,
        },
        (decodedText) => {
          setLastScanned(decodedText);
          onScan(decodedText);
        },
        () => {
          // Frame error, safe to ignore
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera Scanner Error:', err);
      setErrorMsg(err.message || 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.warn('Stop scanner warning:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch {}
      }
    };
  }, []);

  return (
    <div className="bg-slate-900/5 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brandBlue" />
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            Kamera Barcode Scanner (html5-qrcode)
          </span>
        </div>
        <button
          type="button"
          onClick={isScanning ? stopScanner : startScanner}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isScanning
              ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20'
              : 'bg-brandBlue text-white hover:bg-blue-600 shadow-md shadow-brandBlue/20'
          }`}
        >
          {isScanning ? (
            <>
              <CameraOff className="w-3.5 h-3.5" />
              Matikan Kamera
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              Nyalakan Kamera
            </>
          )}
        </button>
      </div>

      {/* Video Viewport Container */}
      <div className="w-full max-w-md relative overflow-hidden rounded-xl bg-black/80 aspect-video flex items-center justify-center border border-slate-300 dark:border-white/10 shadow-inner">
        <div id={containerId} className="w-full h-full" />

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <Camera className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-xs">
              Klik &quot;Nyalakan Kamera&quot; untuk memindai barcode fisik menggunakan kamera laptop / webcam / HP Anda.
            </p>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Target Reticle */}
            <div className="w-48 h-28 border-2 border-brandBlue/80 rounded-lg relative animate-pulse">
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brandBlue" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brandBlue" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brandBlue" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brandBlue" />
              <div className="w-full h-0.5 bg-brandBlue/70 absolute top-1/2 -translate-y-1/2 shadow-[0_0_8px_#3B6EF6]" />
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mt-3 flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {lastScanned && (
        <div className="mt-3 flex items-center justify-between text-xs text-emerald-500 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 w-full">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Terdeteksi: <strong className="font-mono">{lastScanned}</strong></span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded">Scan Sukses</span>
        </div>
      )}
    </div>
  );
}
