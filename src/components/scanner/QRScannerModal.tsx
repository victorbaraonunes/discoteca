import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../../db/database';
import { VinylRecord } from '../../types/vinyl';
import { useLanguage } from '../../i18n/LanguageContext';

interface QRScannerModalProps {
  onClose: () => void;
  onRecordFound: (record: VinylRecord) => void;
  onBarcodeFound: (barcode: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  onClose,
  onRecordFound,
  onBarcodeFound,
}) => {
  const { t } = useLanguage();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'discoteca-qr-reader';

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(readerElementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (!isMounted) return;
            handleScanSuccess(decodedText);
          },
          () => {
            // Ignore frame parse errors
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: any) {
        console.error('Camera scanner error:', err);
        if (isMounted) {
          setErrorMsg(err.message || t('cameraPermissionDenied'));
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .catch((e) => console.warn('Error stopping scanner:', e));
      }
    };
  }, []);

  const handleScanSuccess = async (decodedText: string) => {
    // 1. Try parsing Discoteca QR payload
    try {
      if (decodedText.startsWith('{') && decodedText.endsWith('}')) {
        const payload = JSON.parse(decodedText);
        if (payload.id) {
          const record = await db.records.get(payload.id);
          if (record) {
            stopAndClose();
            onRecordFound(record);
            return;
          }
        }
      }
    } catch {
      // not json
    }

    // 2. Try direct UUID lookup
    const directMatch = await db.records.get(decodedText.trim());
    if (directMatch) {
      stopAndClose();
      onRecordFound(directMatch);
      return;
    }

    // 3. Try searching local database by barcode
    const barcodeMatches = await db.records.where('barcode').equals(decodedText.trim()).toArray();
    if (barcodeMatches.length > 0) {
      stopAndClose();
      onRecordFound(barcodeMatches[0]);
      return;
    }

    // 4. Treat as external barcode for online search
    stopAndClose();
    onBarcodeFound(decodedText.trim());
  };

  const stopAndClose = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(console.warn);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#140e13] border border-rose-950/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#181116] shrink-0">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">{t('scanQrTitle')}</h3>
          </div>
          <button
            onClick={stopAndClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Viewport */}
        <div className="p-4 flex flex-col items-center justify-center">
          <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden bg-black border-2 border-rose-500/40 shadow-inner flex items-center justify-center">
            <div id={readerElementId} className="w-full h-full" />

            {/* Overlay Target Guide */}
            <div className="absolute inset-8 border-2 border-rose-400/70 border-dashed rounded-xl pointer-events-none flex items-center justify-center">
              <div className="w-2 h-2 bg-rose-400 rounded-full animate-ping" />
            </div>
          </div>

          <p className="text-xs text-zinc-400 mt-4 text-center max-w-xs">
            {isScanning ? (
              <span className="text-rose-400 font-semibold flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('scannerActive')}
              </span>
            ) : (
              <span>{t('scannerHint')}</span>
            )}
          </p>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2 max-w-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{t('scannerError')}:</span>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
