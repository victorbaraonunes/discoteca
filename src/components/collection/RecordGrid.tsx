import React from 'react';
import { VinylRecord } from '../../types/vinyl';
import { RecordCard } from './RecordCard';
import { useLanguage } from '../../i18n/LanguageContext';
import { Disc3, Plus } from 'lucide-react';

interface RecordGridProps {
  records: VinylRecord[];
  onSelectRecord: (record: VinylRecord) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onOpenAddModal: () => void;
  searchQuery: string;
  onClearFilters: () => void;
  hasFiltersActive: boolean;
}

export const RecordGrid: React.FC<RecordGridProps> = ({
  records,
  onSelectRecord,
  onToggleFavorite,
  onOpenAddModal,
  searchQuery,
  onClearFilters,
  hasFiltersActive,
}) => {
  const { t } = useLanguage();

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl min-h-[360px] my-6">
        <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-900/40 flex items-center justify-center mb-4 text-rose-400">
          <Disc3 className="w-8 h-8" />
        </div>

        {searchQuery || hasFiltersActive ? (
          <div>
            <h3 className="text-lg font-bold text-zinc-200">{t('noRecordsFound')}</h3>
            <p className="text-sm text-zinc-400 max-w-sm mt-1 mb-4">
              {t('noRecordsFoundDesc')}
            </p>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold rounded-xl transition-all"
            >
              {t('clearSearchFilters')}
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-zinc-200">{t('crateEmpty')}</h3>
            <p className="text-sm text-zinc-400 max-w-sm mt-1 mb-5">
              {t('crateEmptyDesc')}
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 hover:from-rose-500 hover:to-rose-700 text-white font-bold rounded-xl text-sm inline-flex items-center gap-2 shadow-lg shadow-rose-950/50 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {t('addFirstVinyl')}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 pb-16">
      {records.map((record) => (
        <RecordCard
          key={record.id}
          record={record}
          onSelect={onSelectRecord}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};
