import React from 'react';
import { VinylFormat } from '../../types/vinyl';
import { useLanguage } from '../../i18n/LanguageContext';
import { Filter, ArrowUpDown, Disc, Heart, Share2, AlertCircle } from 'lucide-react';

export type FilterTab = 'all' | 'favorites' | 'loaned' | 'overdue';
export type SortOption = 'recent' | 'artist-asc' | 'title-asc' | 'year-desc' | 'year-asc';

interface FilterBarProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  allGenres: string[];
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  filteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeTab,
  onTabChange,
  selectedGenre,
  onGenreChange,
  allGenres,
  selectedFormat,
  onFormatChange,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount,
}) => {
  const { t } = useLanguage();
  const formats: VinylFormat[] = ['12" LP', '10" EP', '7" Single', '2xLP', 'Gatefold', 'Box Set'];

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Primary Category Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="grid w-full grid-cols-2 gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl sm:flex sm:w-auto sm:gap-1.5">
          <button
            onClick={() => onTabChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>{t('allRecords')}</span>
          </button>

          <button
            onClick={() => onTabChange('favorites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'favorites'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{t('favorites')}</span>
          </button>

          <button
            onClick={() => onTabChange('loaned')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'loaned'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{t('onLoan')}</span>
          </button>

          <button
            onClick={() => onTabChange('overdue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'overdue'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t('overdue')}</span>
          </button>
        </div>

        {/* Counter Info */}
        <div className="text-xs text-zinc-500 hidden sm:block">
          {t('showingCount')} <span className="font-semibold text-zinc-300">{filteredCount}</span> {t('ofCount')} {totalCount}
        </div>
      </div>

      {/* Secondary Dropdown Filters & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Genre Filter */}
          <div className="relative">
            <select
              value={selectedGenre}
              onChange={(e) => onGenreChange(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 focus:outline-none focus:border-rose-500 appearance-none cursor-pointer"
            >
              <option value="">{t('allGenres')}</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Format Filter */}
          <div className="relative">
            <select
              value={selectedFormat}
              onChange={(e) => onFormatChange(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 focus:outline-none focus:border-rose-500 appearance-none cursor-pointer"
            >
              <option value="">{t('allFormats')}</option>
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters button if any filter is active */}
          {(selectedGenre || selectedFormat) && (
            <button
              onClick={() => {
                onGenreChange('');
                onFormatChange('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline px-1 py-1"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="relative flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="pl-2 pr-7 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 focus:outline-none focus:border-rose-500 appearance-none cursor-pointer"
          >
            <option value="recent">{t('sortByRecent')}</option>
            <option value="artist-asc">{t('sortByArtistAsc')}</option>
            <option value="title-asc">{t('sortByTitleAsc')}</option>
            <option value="year-desc">{t('sortByYearDesc')}</option>
            <option value="year-asc">{t('sortByYearAsc')}</option>
          </select>
        </div>
      </div>
    </div>
  );
};
