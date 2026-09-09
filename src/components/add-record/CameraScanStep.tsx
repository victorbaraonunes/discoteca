import React, { useState, useRef } from 'react';
import { Camera, Upload, Search, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface CameraScanStepProps {
  onIdentified: (artist: string, title: string, directMetadata?: any) => void;
  onSwitchToSearch: (query: string) => void;
  onOpenSettings?: () => void;
}

export const CameraScanStep: React.FC<CameraScanStepProps> = ({
  onIdentified,
  onSwitchToSearch,
}) => {
  const { t } = useLanguage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing] = useState(false);
  const [errorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUseAsArtwork = () => {
    if (!imagePreview) return;
    // Pass the image URL through as direct metadata so it can be used as cover art
    onIdentified('', '', { coverImageUrl: imagePreview });
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Hero / Upload Area */}
      {!imagePreview ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Snap with Camera Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="p-6 bg-zinc-900/80 hover:bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-rose-500/80 rounded-2xl flex flex-col items-center justify-center text-center transition-all group active:scale-98"
          >
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100">{t('takePhoto')}</h4>
            <p className="text-xs text-zinc-400 mt-1">{t('takePhotoDesc')}</p>
          </button>

          {/* Upload Image File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-6 bg-zinc-900/80 hover:bg-zinc-800 border-2 border-dashed border-zinc-700 hover:border-rose-500/80 rounded-2xl flex flex-col items-center justify-center text-center transition-all group active:scale-98"
          >
            <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:scale-110 transition-transform mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-zinc-100">{t('uploadImage')}</h4>
            <p className="text-xs text-zinc-400 mt-1">{t('uploadImageDesc')}</p>
          </button>
        </div>
      ) : (
        /* Image Preview & Action Card */
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-black border border-zinc-700 shrink-0">
              <img src={imagePreview} alt="Captured vinyl" className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <h4 className="text-sm font-bold text-white">{t('imageCaptured')}</h4>
              <p className="text-xs text-zinc-400">{t('imageCapturedDesc')}</p>

              <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={handleUseAsArtwork}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-rose-900/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('useAsArtwork')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSwitchToSearch('')}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Search className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t('searchByName')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg"
                >
                  {t('retakePhoto')}
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Helpful Hint */}
      <div className="p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
        <RefreshCw className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <span>{t('photoHint')}</span>
      </div>
    </div>
  );
};
