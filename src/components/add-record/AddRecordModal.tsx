import React, { useState } from 'react';
import { VinylRecord } from '../../types/vinyl';
import { db } from '../../db/database';
import { CameraScanStep } from './CameraScanStep';
import { OnlineSearchStep } from './OnlineSearchStep';
import { ManualFormStep } from './ManualFormStep';
import { useLanguage } from '../../i18n/LanguageContext';
import { X, Camera, Search, Edit3 } from 'lucide-react';
import { generateUUID } from '../../utils/formatters';

interface AddRecordModalProps {
  onClose: () => void;
  onRecordAdded: (record: VinylRecord) => void;
}

type AddTab = 'camera' | 'search' | 'manual';

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  onClose,
  onRecordAdded,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AddTab>('camera');
  const [prefilledData, setPrefilledData] = useState<Partial<VinylRecord> | null>(null);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');

  const handleIdentifiedFromCamera = (_artist: string, _title: string, directMetadata?: any) => {
    if (directMetadata?.coverImageUrl) {
      // Photo selected as artwork — pre-fill cover and go to manual
      setPrefilledData({ coverImageUrl: directMetadata.coverImageUrl });
      setActiveTab('manual');
    } else {
      setSearchInitialQuery(`${_artist} ${_title}`);
      setActiveTab('search');
    }
  };

  const handleSelectOnlineRelease = (fullData: any) => {
    setPrefilledData(fullData);
    setActiveTab('manual');
  };

  const handleSaveToCollection = async (
    recordData: Omit<VinylRecord, 'id' | 'dateAdded' | 'isLoaned' | 'loanHistory'>
  ) => {
    const newRecord: VinylRecord = {
      ...recordData,
      id: generateUUID(),
      dateAdded: new Date().toISOString(),
      isLoaned: false,
      loanHistory: [],
    };

    await db.records.add(newRecord);
    onRecordAdded(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-3xl bg-[#140e13] border border-rose-950/60 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-3rem)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-zinc-800/80 bg-[#181116]/80 backdrop-blur-sm shrink-0">
          <h3 className="text-lg font-bold text-white font-display">{t('addVinylRecord')}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-3 bg-zinc-900/40 border-b border-zinc-800 shrink-0">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('camera')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'camera'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>1. {t('tabPhoto')}</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'search'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>2. {t('tabOnlineSearch')}</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'manual'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>3. {t('tabReviewSave')}</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {activeTab === 'camera' && (
            <CameraScanStep
              onIdentified={handleIdentifiedFromCamera}
              onSwitchToSearch={(q) => {
                setSearchInitialQuery(q);
                setActiveTab('search');
              }}
            />
          )}

          {activeTab === 'search' && (
            <OnlineSearchStep
              initialQuery={searchInitialQuery}
              onSelectRelease={handleSelectOnlineRelease}
            />
          )}

          {activeTab === 'manual' && (
            <ManualFormStep
              initialData={prefilledData || undefined}
              onSave={handleSaveToCollection}
              onBack={() => setActiveTab('search')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
