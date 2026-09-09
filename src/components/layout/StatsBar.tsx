import React from 'react';
import { VinylRecord } from '../../types/vinyl';
import { isLoanOverdue } from '../../utils/formatters';
import { useLanguage } from '../../i18n/LanguageContext';
import { Disc3, Heart, Share2, AlertTriangle, Music, DollarSign } from 'lucide-react';

interface StatsBarProps {
  records: VinylRecord[];
  onSelectFilter: (tab: 'all' | 'favorites' | 'loaned' | 'overdue') => void;
  activeFilterTab: string;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  records,
  onSelectFilter,
  activeFilterTab,
}) => {
  const { t } = useLanguage();

  const total = records.length;
  const favorites = records.filter(r => r.isFavorite).length;
  const loaned = records.filter(r => r.isLoaned);
  const overdue = loaned.filter(r => isLoanOverdue(r.currentLoan?.expectedReturnAt));

  // Calculate top genre
  const genreCounts: Record<string, number> = {};
  let totalValue = 0;

  records.forEach(r => {
    (r.genres || []).forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
    if (r.purchasePrice) {
      totalValue += r.purchasePrice;
    }
  });

  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Rock / Pop';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Total Records */}
      <button
        onClick={() => onSelectFilter('all')}
        className={`p-3.5 rounded-xl border text-left transition-all ${
          activeFilterTab === 'all'
            ? 'bg-zinc-900 border-rose-500/60 shadow-md shadow-rose-950/20'
            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">{t('totalAlbums')}</span>
          <Disc3 className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-display">{total}</span>
          <span className="text-xs text-zinc-500">{t('albumsUnit')}</span>
        </div>
      </button>

      {/* Favorites */}
      <button
        onClick={() => onSelectFilter('favorites')}
        className={`p-3.5 rounded-xl border text-left transition-all ${
          activeFilterTab === 'favorites'
            ? 'bg-zinc-900 border-rose-500/60 shadow-md shadow-rose-950/20'
            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">{t('favorites')}</span>
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-display">{favorites}</span>
          <span className="text-xs text-zinc-500">{t('starredUnit')}</span>
        </div>
      </button>

      {/* On Loan / Borrowed */}
      <button
        onClick={() => onSelectFilter('loaned')}
        className={`p-3.5 rounded-xl border text-left transition-all ${
          activeFilterTab === 'loaned'
            ? 'bg-zinc-900 border-blue-500/60 shadow-md shadow-blue-950/20'
            : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">{t('onLoan')}</span>
          <Share2 className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-blue-400 font-display">{loaned.length}</span>
          <span className="text-xs text-zinc-500">{t('borrowedUnit')}</span>
        </div>
      </button>

      {/* Overdue alert / Top Genre */}
      {overdue.length > 0 ? (
        <button
          onClick={() => onSelectFilter('overdue')}
          className={`p-3.5 rounded-xl border text-left transition-all animate-pulse ${
            activeFilterTab === 'overdue'
              ? 'bg-rose-950/50 border-rose-500 shadow-md shadow-rose-900/40'
              : 'bg-rose-950/30 border-rose-900/60 hover:bg-rose-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-300">{t('overdueReturns')}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 font-display">{overdue.length}</span>
            <span className="text-xs text-rose-300">{t('attentionUnit')}</span>
          </div>
        </button>
      ) : (
        <div className="p-3.5 rounded-xl border bg-zinc-900/60 border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">{t('topGenre')}</span>
            <Music className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-1 truncate">
            <span className="text-lg font-bold text-zinc-200 font-display truncate block">{topGenre}</span>
          </div>
        </div>
      )}

      {/* Collection Est. Value */}
      <div className="p-3.5 rounded-xl border bg-zinc-900/60 border-zinc-800 hidden lg:block">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">{t('estValue')}</span>
          <DollarSign className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400 font-display">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-zinc-500">{t('recordedUnit')}</span>
        </div>
      </div>
    </div>
  );
};
