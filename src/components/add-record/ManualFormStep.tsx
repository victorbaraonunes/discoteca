import React, { useState } from 'react';
import { VinylRecord, Track, VinylFormat, VinylSpeed, GoldmineCondition } from '../../types/vinyl';
import { Plus, Trash2, Music, Image, Star } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { formatDateForForm, parseDateFromForm } from '../../utils/formatters';

interface ManualFormStepProps {
  initialData?: Partial<VinylRecord>;
  onSave: (recordData: Omit<VinylRecord, 'id' | 'dateAdded' | 'isLoaned' | 'loanHistory'>) => Promise<void>;
  onBack?: () => void;
}

export const ManualFormStep: React.FC<ManualFormStepProps> = ({
  initialData,
  onSave,
  onBack,
}) => {
  const { t, defaultCurrency } = useLanguage();
  const [title, setTitle] = useState(initialData?.title || '');
  const [artist, setArtist] = useState(initialData?.artist || '');
  const [releaseYear, setReleaseYear] = useState<number | undefined>(initialData?.releaseYear);
  const [label, setLabel] = useState(initialData?.label || '');
  const [catalogNumber, setCatalogNumber] = useState(initialData?.catalogNumber || '');
  const [barcode, setBarcode] = useState(initialData?.barcode || '');
  const [format, setFormat] = useState<VinylFormat>(initialData?.format || '12" LP');
  const [speed, setSpeed] = useState<VinylSpeed>(initialData?.speed || '33⅓ RPM');
  const [vinylColor, setVinylColor] = useState(initialData?.vinylColor || '');
  const [mediaCondition, setMediaCondition] = useState<GoldmineCondition | null>(initialData?.mediaCondition ?? null);
  const [sleeveCondition, setSleeveCondition] = useState<GoldmineCondition | null>(initialData?.sleeveCondition ?? null);
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || '');
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>(initialData?.purchasePrice);
  const [dateAcquired, setDateAcquired] = useState(formatDateForForm(initialData?.dateAcquired));
  const currency = initialData?.currency || defaultCurrency;
  const [rating, setRating] = useState<number | undefined>(initialData?.rating);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [genresText, setGenresText] = useState((initialData?.genres || []).join(', '));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tracklist State
  const [tracks, setTracks] = useState<Track[]>(initialData?.tracks || []);

  const handleAddTrack = () => {
    if (tracks.length === 0) {
      setTracks([{ position: 'A1', title: '', duration: '' }]);
      return;
    }
    const lastPos = tracks[tracks.length - 1]?.position || 'A1';
    const side = lastPos.charAt(0);
    const num = parseInt(lastPos.slice(1)) || tracks.length;
    setTracks([...tracks, { position: `${side}${num + 1}`, title: '', duration: '' }]);
  };

  const handleRemoveTrack = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const handleTrackChange = (index: number, field: keyof Track, value: string) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    setTracks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!title.trim() || !artist.trim()) {
      setSubmitError(t('requiredTitleArtist'));
      return;
    }

    const genres = genresText
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0);

    const validTracks = tracks.filter(t => t.title.trim().length > 0);
    const normalizedDateAcquired = parseDateFromForm(dateAcquired);
    if (normalizedDateAcquired === null) {
      setSubmitError(t('invalidDate'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        artist: artist.trim(),
        releaseYear,
        label: label.trim() || undefined,
        catalogNumber: catalogNumber.trim() || undefined,
        barcode: barcode.trim() || undefined,
        format,
        speed,
        vinylColor: vinylColor.trim() || undefined,
        mediaCondition,
        sleeveCondition,
        coverImageUrl: coverImageUrl.trim() || undefined,
        purchasePrice,
        dateAcquired: normalizedDateAcquired,
        currency,
        rating,
        notes: notes.trim() || undefined,
        genres,
        tracks: validTracks,
        credits: initialData?.credits || [],
        isFavorite: initialData?.isFavorite || false,
      });
    } catch (error) {
      console.error('Failed to save record:', error);
      setSubmitError(t('saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 text-xs sm:text-sm">
      {/* Title & Artist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            {t('albumTitleReq')} <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('placeholderAlbumTitle')}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-semibold mb-1">
            {t('artistReq')} <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder={t('placeholderArtist')}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Format, Speed, Release Year & Color */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('releaseYear')}</label>
          <input
            type="number"
            value={releaseYear || ''}
            onChange={(e) => setReleaseYear(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder={t('placeholderReleaseYear')}
            className="w-full min-w-0 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('format')}</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as VinylFormat)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="12&quot; LP">12" LP</option>
            <option value="10&quot; EP">10" EP</option>
            <option value="7&quot; Single">7" Single</option>
            <option value="2xLP">2xLP</option>
            <option value="Gatefold">Gatefold</option>
            <option value="Box Set">Box Set</option>
          </select>
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('speed')}</label>
          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value as VinylSpeed)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="33⅓ RPM">33⅓ RPM</option>
            <option value="45 RPM">45 RPM</option>
            <option value="78 RPM">78 RPM</option>
          </select>
        </div>

      </div>

      {/* Tracklist */}
      <section className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5" /> {t('tracklist')}
          </span>
          <button
            type="button"
            onClick={handleAddTrack}
            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> {t('addTrack')}
          </button>
        </div>

        {tracks.length === 0 ? (
          <p className="text-xs text-zinc-500">{t('notSpecified')}</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {tracks.map((track, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={track.position}
                  onChange={(e) => handleTrackChange(idx, 'position', e.target.value)}
                  placeholder="A1"
                  className="w-14 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-xs font-mono font-bold text-amber-400"
                />
                <input
                  type="text"
                  value={track.title}
                  onChange={(e) => handleTrackChange(idx, 'title', e.target.value)}
                  placeholder={t('trackTitle')}
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                />
                <input
                  type="text"
                  value={track.duration || ''}
                  onChange={(e) => handleTrackChange(idx, 'duration', e.target.value)}
                  placeholder={t('trackDuration')}
                  className="w-20 px-2 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-xs font-mono text-zinc-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveTrack(idx)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg"
                  aria-label={t('removeTrack')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <details className="group rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-300 marker:hidden flex items-center justify-between">
          {t('advancedDetails')}
          <span className="text-zinc-500 transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="space-y-5 px-4 pb-4">
        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('colorVariant')}</label>
          <input
            type="text"
            value={vinylColor}
            onChange={(e) => setVinylColor(e.target.value)}
            placeholder={t('placeholderVinylColor')}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

      {/* Condition and price */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('mediaCondition')}</label>
          <select
            value={mediaCondition ?? ''}
            onChange={(e) => setMediaCondition(e.target.value ? e.target.value as GoldmineCondition : null)}
            className="w-full min-w-0 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="">{t('notSpecified')}</option>
            <option value="M">{t('cond_M')}</option>
            <option value="NM">{t('cond_NM')}</option>
            <option value="VG+">{t('cond_VGplus')}</option>
            <option value="VG">{t('cond_VG')}</option>
            <option value="G+">{t('cond_Gplus')}</option>
            <option value="G">{t('cond_G')}</option>
            <option value="F">{t('cond_F')}</option>
            <option value="P">{t('cond_P')}</option>
          </select>
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('sleeveCondition')}</label>
          <select
            value={sleeveCondition ?? ''}
            onChange={(e) => setSleeveCondition(e.target.value ? e.target.value as GoldmineCondition : null)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="">{t('notSpecified')}</option>
            <option value="M">{t('cond_M')}</option>
            <option value="NM">{t('cond_NM')}</option>
            <option value="VG+">{t('cond_VGplus')}</option>
            <option value="VG">{t('cond_VG')}</option>
            <option value="G+">{t('cond_Gplus')}</option>
            <option value="G">{t('cond_G')}</option>
            <option value="F">{t('cond_F')}</option>
            <option value="P">{t('cond_P')}</option>
          </select>
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('purchasePrice')}</label>
          <input
            type="number"
            step="0.5"
            value={purchasePrice || ''}
            onChange={(e) => setPurchasePrice(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder={t('placeholderPrice')}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-zinc-300 font-medium mb-1">{t('dateAcquired')}</label>
          <input
            type="text"
            value={dateAcquired}
            onChange={(e) => setDateAcquired(e.target.value)}
            placeholder={t('placeholderDate')}
            className="w-full min-w-0 max-w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Label, Catalog #, Barcode & Genres */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('recordLabel')}</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('placeholderRecordLabel')}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('catalogNumber')}</label>
          <input
            type="text"
            value={catalogNumber}
            onChange={(e) => setCatalogNumber(e.target.value)}
            placeholder={t('placeholderCatalogNumber')}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('barcode')}</label>
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder={t('placeholderBarcode')}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium mb-1">{t('genresComma')}</label>
          <input
            type="text"
            value={genresText}
            onChange={(e) => setGenresText(e.target.value)}
            placeholder={t('placeholderGenres')}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Rating & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-zinc-300 font-medium mb-1 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400" /> {t('ratingLabel')}
          </label>
          <select
            value={rating ?? ''}
            onChange={(e) => setRating(e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="">{t('notSpecified')}</option>
            <option value={5}>{t('ratingFive')}</option>
            <option value={4}>{t('ratingFour')}</option>
            <option value={3}>{t('ratingThree')}</option>
            <option value={2}>{t('ratingTwo')}</option>
            <option value={1}>{t('ratingOne')}</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-zinc-300 font-medium mb-1">{t('personalNotes')}</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('placeholderNotes')}
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Cover Image URL */}
      <div>
        <label className="block text-zinc-300 font-medium mb-1 flex items-center gap-1.5">
          <Image className="w-3.5 h-3.5 text-zinc-400" />
          <span>{t('coverImageUrl')}</span>
        </label>
        <input
          type="url"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder={t('placeholderCoverUrl')}
          className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
        />
      </div>

        </div>
      </details>

      {submitError && (
        <p role="alert" className="rounded-xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
          {submitError}
        </p>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl"
          >
            {t('back')}
          </button>
        ) : <div />}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-black font-bold rounded-xl text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all"
        >
          {isSubmitting ? t('saving') : t('saveToCollection')}
        </button>
      </div>
    </form>
  );
};
