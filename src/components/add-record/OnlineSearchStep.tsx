import React, { useState, useEffect, useRef } from 'react';
import { OnlineSearchResult } from '../../types/vinyl';
import { searchMusicBrainz, fetchMusicBrainzDetails } from '../../services/musicBrainzService';
import { fetchWikipediaAlbumInfo } from '../../services/wikipediaService';
import { useLanguage } from '../../i18n/LanguageContext';
import { Search, Disc3, RefreshCw, Sparkles, ArrowRight } from 'lucide-react';

interface OnlineSearchStepProps {
  initialQuery?: string;
  onSelectRelease: (fullRecordData: any) => void;
}

export const OnlineSearchStep: React.FC<OnlineSearchStepProps> = ({
  initialQuery = '',
  onSelectRelease,
}) => {
  const { t } = useLanguage();
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState(initialQuery);
  const [catalogNumber, setCatalogNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [preferBrazil, setPreferBrazil] = useState(() => localStorage.getItem('discoteca_prefer_brazil') !== 'false');
  const [results, setResults] = useState<OnlineSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const latestSearchId = useRef(0);

  useEffect(() => {
    const searchId = ++latestSearchId.current;
    const hasSearchInput = [artist, title, catalogNumber, barcode].some((value) => value.trim().length >= 2);
    if (!hasSearchInput) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const res = await searchMusicBrainz({ artist, title, catalogNumber, barcode, preferBrazil }, controller.signal);
        if (searchId === latestSearchId.current) setResults(res);
      } catch (err) {
        console.error(err);
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (searchId === latestSearchId.current) {
          setResults([]);
          setSearchError(t('searchUnavailable'));
        }
      } finally {
        if (searchId === latestSearchId.current) setIsSearching(false);
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [artist, title, catalogNumber, barcode, preferBrazil, searchAttempt, t]);

  const updateBrazilPreference = (enabled: boolean) => {
    setPreferBrazil(enabled);
    localStorage.setItem('discoteca_prefer_brazil', String(enabled));
  };

  const hasSearchInput = [artist, title, catalogNumber, barcode].some((value) => value.trim().length >= 2);

  const handlePickRelease = async (res: OnlineSearchResult) => {
    setIsLoadingDetails(true);
    setLoadingId(res.id);
    try {
      const mbDetails = await fetchMusicBrainzDetails(res.id);
      const artist = mbDetails?.artist || res.artist;
      const title = mbDetails?.title || res.title;
      const wikiInfo = await fetchWikipediaAlbumInfo(title, artist);

      const combinedData = {
        title,
        artist,
        releaseYear: mbDetails?.releaseYear || res.year,
        label: mbDetails?.label || res.label,
        catalogNumber: mbDetails?.catalogNumber,
        country: mbDetails?.country || res.country,
        barcode: mbDetails?.barcode || res.barcode,
        format: mbDetails?.format || '12" LP',
        speed: '33⅓ RPM',
        mediaCondition: null,
        sleeveCondition: null,
        coverImageUrl: mbDetails?.coverImageUrl || res.coverImageUrl || wikiInfo?.thumbnailUrl,
        tracks: mbDetails?.tracks || [],
        credits: [
          ...(mbDetails?.credits || []),
          ...(wikiInfo?.producerCredits || []).map(p => ({ role: 'Producer', name: p })),
        ],
        genres: mbDetails?.genres || [],
      };

      onSelectRelease(combinedData);
    } catch (err) {
      console.error('Failed to load full release info:', err);
    } finally {
      setIsLoadingDetails(false);
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Structured Search Inputs */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-zinc-300">
            <span className="mb-1 block">{t('searchArtist')}</span>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} placeholder={t('searchPlaceholderArtist')} inputMode="text" autoCorrect="off" autoCapitalize="words" spellCheck={false} className="w-full pl-10 pr-3 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
            </div>
          </label>
          <label className="block text-xs font-medium text-zinc-300">
            <span className="mb-1 block">{t('searchAlbum')}</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('searchPlaceholderAlbum')} inputMode="text" autoCorrect="off" autoCapitalize="words" spellCheck={false} className="w-full px-3 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block text-xs font-medium text-zinc-300">
            <span className="mb-1 block">{t('catalogNumber')}</span>
            <input type="text" value={catalogNumber} onChange={(e) => setCatalogNumber(e.target.value)} placeholder={t('placeholderCatalogNumber')} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
          </label>
          <label className="block text-xs font-medium text-zinc-300">
            <span className="mb-1 block">{t('barcode')}</span>
            <input type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder={t('placeholderBarcode')} className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input type="checkbox" checked={preferBrazil} onChange={(e) => updateBrazilPreference(e.target.checked)} className="accent-rose-500" />
          {t('preferBrazil')}
          {isSearching && <RefreshCw className="w-3.5 h-3.5 text-rose-400 animate-spin" />}
        </label>
        {isSearching && <p className="text-xs text-zinc-500">{t('searchingMusicBrainz')}</p>}
        {searchError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
            <span>{searchError}</span>
            <button type="button" onClick={() => setSearchAttempt((attempt) => attempt + 1)} className="font-semibold text-amber-300 hover:text-amber-100 whitespace-nowrap">
              {t('tryAgain')}
            </button>
          </div>
        )}
      </div>

      {/* MusicBrainz & Wikipedia Info Banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400">
        <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>
          {t('poweredBy')} <strong>MusicBrainz</strong> &amp; <strong>Cover Art Archive</strong> {t('withWikipedia')} <strong>Wikipedia</strong> {t('triviaEnrichment')}.
        </span>
      </div>

      {/* Results List */}
      <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
        {results.map((res) => {
          const isLoadingThis = isLoadingDetails && loadingId === res.id;

          return (
            <div
              key={res.id}
              onClick={() => !isLoadingDetails && handlePickRelease(res)}
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                isLoadingThis
                  ? 'bg-rose-500/10 border-rose-500/50 shadow-md'
                  : 'bg-zinc-900/70 hover:bg-zinc-800/80 border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {/* Cover Preview */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-zinc-700/60 shrink-0 flex items-center justify-center">
                {res.coverImageUrl ? (
                  <img
                    src={res.coverImageUrl}
                    alt={res.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Disc3 className="w-6 h-6 text-zinc-600" />
                )}
              </div>

              {/* Title, Artist, Year */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-zinc-100 truncate">{res.title}</h4>
                <p className="text-xs text-rose-400 truncate">{res.artist}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                  {res.year && <span>{res.year}</span>}
                  {res.label && <span>• {res.label}</span>}
                  {res.trackCount && <span>• {res.trackCount} {t('tracksUnit')}</span>}
                  {res.country && <span>• {res.country}</span>}
                </div>
              </div>

              {/* Action */}
              <div className="shrink-0">
                {isLoadingThis ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-xl">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('loading')}</span>
                  </div>
                ) : (
                  <button className="px-3 py-1.5 bg-zinc-800 hover:bg-rose-700 text-zinc-300 hover:text-white font-semibold text-xs rounded-xl flex items-center gap-1 transition-all">
                    <span>{t('select')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {hasSearchInput && !isSearching && results.length === 0 && (
          <div className="py-12 text-center text-zinc-500 text-xs">
            {t('noReleasesFound')}. {t('tryManually')}
          </div>
        )}
      </div>
    </div>
  );
};
