import React, { useEffect, useState } from 'react';
import { VinylRecord } from '../../types/vinyl';
import { getConditionBadge, isLoanOverdue } from '../../utils/formatters';
import { useLanguage } from '../../i18n/LanguageContext';
import { Heart, Disc3, Share2, AlertTriangle } from 'lucide-react';

interface RecordCardProps {
  record: VinylRecord;
  onSelect: (record: VinylRecord) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const RecordCard: React.FC<RecordCardProps> = ({
  record,
  onSelect,
  onToggleFavorite,
}) => {
  const { t, language } = useLanguage();
  const cond = getConditionBadge(record.mediaCondition, language);
  const isOverdue = record.isLoaned && isLoanOverdue(record.currentLoan?.expectedReturnAt);
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);

  useEffect(() => {
    setCoverLoadFailed(false);
  }, [record.coverImageUrl]);

  return (
    <div
      onClick={() => onSelect(record)}
      className="group relative bg-[#171316] hover:bg-[#20181e] border border-zinc-800/80 hover:border-rose-900/60 rounded-2xl p-3.5 flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1"
    >
      {/* Album Artwork & Vinyl Disc Peek */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-950 shadow-inner flex items-center justify-center mb-3.5">
        {/* Animated Vinyl Disc peeking on hover */}
        <div className="absolute inset-0 flex items-center justify-center transform translate-x-0 group-hover:translate-x-4 transition-transform duration-500 ease-out z-0 pointer-events-none">
          <div className="w-[90%] h-[90%] rounded-full vinyl-grooves border border-zinc-700/80 shadow-2xl flex items-center justify-center">
            {/* Center Vinyl Label */}
            <div className="w-10 h-10 rounded-full bg-rose-800 border border-zinc-900 flex items-center justify-center text-[8px] font-bold text-white uppercase tracking-tighter shadow-inner">
              {record.speed === '45 RPM' ? '45' : '33'}
            </div>
          </div>
        </div>

        {/* Cover Sleeve Image */}
        <div className="relative z-10 w-full h-full rounded-xl overflow-hidden border border-white/5 bg-zinc-900 shadow-md">
          {record.coverImageUrl && !coverLoadFailed ? (
            <img
              src={record.coverImageUrl}
              alt={`${record.title} by ${record.artist}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={() => setCoverLoadFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-zinc-900 to-zinc-950">
              <Disc3 className="w-12 h-12 text-zinc-600 mb-2 group-hover:rotate-45 transition-transform" />
              <span className="text-xs font-medium text-zinc-400 line-clamp-2">{record.title}</span>
            </div>
          )}

          {/* Format Badge overlay */}
          <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/75 backdrop-blur-md text-zinc-200 border border-white/10">
              {record.format}
            </span>
          </div>

          {/* Favorite Star Button */}
          <button
            onClick={(e) => onToggleFavorite(record.id, e)}
            title={record.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 hover:text-white border border-white/10 transition-transform active:scale-90 z-20"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                record.isFavorite ? 'fill-rose-500 text-rose-500' : 'hover:text-rose-400'
              }`}
            />
          </button>

          {/* On Loan / Borrowed Banner */}
          {record.isLoaned && (
            <div
              className={`absolute bottom-0 inset-x-0 py-1 px-2 text-[11px] font-semibold flex items-center justify-between backdrop-blur-md z-20 ${
                isOverdue
                  ? 'bg-rose-950/90 text-rose-200 border-t border-rose-600/50'
                  : 'bg-blue-950/90 text-blue-200 border-t border-blue-600/50'
              }`}
            >
              <div className="flex items-center gap-1 truncate">
                {isOverdue ? (
                  <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                ) : (
                  <Share2 className="w-3 h-3 text-blue-400 shrink-0" />
                )}
                <span className="truncate">{t('lentTo')} {record.currentLoan?.borrowerName}</span>
              </div>
              {isOverdue && <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-400">{t('overdueCaps')}</span>}
            </div>
          )}
        </div>
      </div>

      {/* Album Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-sm text-zinc-100 line-clamp-1 group-hover:text-rose-400 transition-colors">
              {record.title}
            </h3>
            {record.releaseYear && (
              <span className="text-xs text-zinc-500 font-mono shrink-0">{record.releaseYear}</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{record.artist}</p>
        </div>

        {/* Tags & Condition Footer */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/70 flex items-center justify-between text-xs">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${cond.color}`}>
            {cond.label}
          </span>
          <span className="text-[11px] text-zinc-500 truncate max-w-[120px]">
            {record.genres?.[0] || record.label || '—'}
          </span>
        </div>
      </div>
    </div>
  );
};
