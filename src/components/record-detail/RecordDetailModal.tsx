import React, { useEffect, useRef, useState } from 'react';
import { VinylRecord, GoldmineCondition, VinylFormat, VinylSpeed } from '../../types/vinyl';
import { db } from '../../db/database';
import { formatCurrency, formatDateForForm, formatDateOnly, getConditionBadge, parseDateFromForm } from '../../utils/formatters';
import { useLanguage } from '../../i18n/LanguageContext';
import { TracklistView } from './TracklistView';
import { TriviaCreditsView } from './TriviaCreditsView';
import { LendingTab } from './LendingTab';
import {
  X,
  Heart,
  Disc3,
  Trash2,
  Edit3,
  Music,
  Users,
  Info,
  Star,
  DollarSign,
  Calendar,
  Camera,
  Save,
  Share2,
} from 'lucide-react';

interface RecordDetailModalProps {
  record: VinylRecord | null;
  onClose: () => void;
  onRecordUpdated: (updated: VinylRecord) => void;
  onRecordDeleted: (id: string) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

type DetailTab = 'tracks' | 'credits' | 'mycopy' | 'lending';

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onRecordUpdated,
  onRecordDeleted,
  onToggleFavorite,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<DetailTab>('tracks');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState(record?.title || '');
  const [editArtist, setEditArtist] = useState(record?.artist || '');
  const [editYear, setEditYear] = useState<number | undefined>(record?.releaseYear);
  const [editLabel, setEditLabel] = useState(record?.label || '');
  const [editCatalog, setEditCatalog] = useState(record?.catalogNumber || '');
  const [editBarcode, setEditBarcode] = useState(record?.barcode || '');
  const [editFormat, setEditFormat] = useState<VinylFormat>(record?.format || '12" LP');
  const [editSpeed, setEditSpeed] = useState<VinylSpeed>(record?.speed || '33⅓ RPM');
  const [editColor, setEditColor] = useState(record?.vinylColor || '');
  const [editMediaCond, setEditMediaCond] = useState<GoldmineCondition | null>(record?.mediaCondition ?? null);
  const [editSleeveCond, setEditSleeveCond] = useState<GoldmineCondition | null>(record?.sleeveCondition ?? null);
  const [editPrice, setEditPrice] = useState<number | undefined>(record?.purchasePrice);
  const [editDateAcquired, setEditDateAcquired] = useState(formatDateForForm(record?.dateAcquired));
  const [editGenresText, setEditGenresText] = useState((record?.genres || []).filter((genre) => genre !== 'Vinyl').join(', '));
  const [editRating, setEditRating] = useState<number | undefined>(record?.rating);
  const [editNotes, setEditNotes] = useState(record?.notes || '');
  const [editCoverUrl, setEditCoverUrl] = useState(record?.coverImageUrl || '');
  const [editUserPhotos, setEditUserPhotos] = useState(record?.userPhotos || []);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setCoverLoadFailed(false);
  }, [record?.id, record?.coverImageUrl]);

  if (!record) return null;

  const mediaCondBadge = getConditionBadge(record.mediaCondition, language);
  const sleeveCondBadge = getConditionBadge(record.sleeveCondition, language);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedDateAcquired = parseDateFromForm(editDateAcquired);
    if (normalizedDateAcquired === null) {
      setEditError(t('invalidDate'));
      return;
    }
    setEditError(null);
    const updated: VinylRecord = {
      ...record,
      title: editTitle.trim() || record.title,
      artist: editArtist.trim() || record.artist,
      releaseYear: editYear,
      label: editLabel.trim() || undefined,
      catalogNumber: editCatalog.trim() || undefined,
      barcode: editBarcode.trim() || undefined,
      format: editFormat,
      speed: editSpeed,
      vinylColor: editColor.trim() || undefined,
      mediaCondition: editMediaCond,
      sleeveCondition: editSleeveCond,
      purchasePrice: editPrice,
      dateAcquired: normalizedDateAcquired,
      genres: editGenresText.split(',').map((genre) => genre.trim()).filter(Boolean),
      rating: editRating,
      notes: editNotes.trim() || undefined,
      coverImageUrl: editCoverUrl.trim() || undefined,
      userPhotos: editUserPhotos,
    };

    await db.records.put(updated);
    onRecordUpdated(updated);
    setIsEditing(false);
  };

  const handlePhotoSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const photo = event.target.files?.[0];
    if (!photo) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditCoverUrl(dataUrl);
      setEditUserPhotos((currentPhotos) => [...currentPhotos, dataUrl]);
      setCoverLoadFailed(false);
    };
    reader.readAsDataURL(photo);
    event.target.value = '';
  };

  const handleDelete = async () => {
    await db.records.delete(record.id);
    onRecordDeleted(record.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-4xl bg-[#140e13] border border-rose-950/60 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-3rem)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-zinc-800/80 bg-[#181116]/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              {record.format}
            </span>
            <span className="text-xs text-zinc-400 font-mono">{record.speed}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => onToggleFavorite(record.id, e)}
              className="p-2 rounded-xl bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95"
            >
              <Heart
                className={`w-4 h-4 ${
                  record.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-xl bg-zinc-800/70 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all active:scale-95"
              title={t('editRecord')}
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl bg-zinc-800/70 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 transition-all active:scale-95"
              title={t('deleteRecord')}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all active:scale-95 ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Alert */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-950/70 border-b border-rose-800 text-sm flex items-center justify-between gap-4">
            <span className="text-rose-200">
              {t('deleteConfirmTitle')} <strong>"{record.title}"</strong> {t('fromCollection')}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg"
              >
                {t('yesDelete')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
          {/* Top Hero: Artwork & Title */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Album Sleeve Presentation */}
            <div className="w-48 sm:w-56 aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 shadow-2xl relative group">
              {record.coverImageUrl && !coverLoadFailed ? (
                <img
                  src={record.coverImageUrl}
                  alt={record.title}
                  className="w-full h-full object-cover"
                  onError={() => setCoverLoadFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-center">
                  <Disc3 className="w-16 h-16 text-zinc-600 mb-2" />
                  <span className="text-xs text-zinc-400">{t('noCoverArt')}</span>
                </div>
              )}

              {record.vinylColor && (
                <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md text-[10px] text-zinc-300 border border-white/10 text-center font-medium truncate">
                  {record.vinylColor}
                </div>
              )}
            </div>

            {/* Album Metadata & Badges */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                  {record.title}
                </h2>
                <p className="text-lg text-rose-400 font-medium mt-0.5">{record.artist}</p>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {record.releaseYear && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                    {record.releaseYear}
                  </span>
                )}
                {record.label && (
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                    {record.label}
                  </span>
                )}
                {record.catalogNumber && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                    Cat# {record.catalogNumber}
                  </span>
                )}
                {record.country && (
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                    {record.country}
                  </span>
                )}
              </div>

              {/* Condition & Rating Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-500">{t('mediaLabel')}:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${mediaCondBadge.color}`}>
                    {mediaCondBadge.label} ({mediaCondBadge.full})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-zinc-500">{t('sleeveLabel')}:</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${sleeveCondBadge.color}`}>
                    {sleeveCondBadge.label} ({sleeveCondBadge.full})
                  </span>
                </div>

                {record.rating && (
                  <div className="flex items-center gap-0.5 text-rose-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < (record.rating || 0) ? 'fill-rose-500 text-rose-500' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Genres list */}
              {record.genres && record.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {record.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-900 text-zinc-400 border border-zinc-800"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Edit Form Drawer */}
          {isEditing && (
            <div className="p-5 bg-zinc-900/90 border border-rose-500/30 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> {t('editRecordDetails')}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {t('cancel')}
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('albumTitleReq')}</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('artistReq')}</label>
                    <input
                      type="text"
                      value={editArtist}
                      onChange={(e) => setEditArtist(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('releaseYear')}</label>
                    <input
                      type="number"
                      value={editYear || ''}
                      onChange={(e) => setEditYear(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full min-w-0 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('format')}</label>
                    <select
                      value={editFormat}
                      onChange={(e) => setEditFormat(e.target.value as VinylFormat)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
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
                    <label className="block text-zinc-400 mb-1">{t('speed')}</label>
                    <select
                      value={editSpeed}
                      onChange={(e) => setEditSpeed(e.target.value as VinylSpeed)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    >
                      <option value="33⅓ RPM">33⅓ RPM</option>
                      <option value="45 RPM">45 RPM</option>
                      <option value="78 RPM">78 RPM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('colorVariant')}</label>
                    <input
                      type="text"
                      placeholder="e.g. Splatter, Blue"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('mediaCondition')}</label>
                    <select
                      value={editMediaCond ?? ''}
                      onChange={(e) => setEditMediaCond(e.target.value ? e.target.value as GoldmineCondition : null)}
                      className="w-full min-w-0 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
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
                    <label className="block text-zinc-400 mb-1">{t('sleeveCondition')}</label>
                    <select
                      value={editSleeveCond ?? ''}
                      onChange={(e) => setEditSleeveCond(e.target.value ? e.target.value as GoldmineCondition : null)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
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
                    <label className="block text-zinc-400 mb-1">{t('purchasePrice')} ({record.currency === 'USD' || record.currency === '$' ? 'US$' : 'R$'})</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editPrice || ''}
                      onChange={(e) => setEditPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-zinc-400 mb-1">{t('dateAcquired')}</label>
                    <input
                      type="text"
                      value={editDateAcquired}
                      onChange={(e) => setEditDateAcquired(e.target.value)}
                      placeholder={t('placeholderDate')}
                      className="w-full min-w-0 max-w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('recordLabel')}</label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('catalogNumber')}</label>
                    <input
                      type="text"
                      value={editCatalog}
                      onChange={(e) => setEditCatalog(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('barcode')}</label>
                    <input
                      type="text"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">{t('ratingLabel')}</label>
                    <select
                      value={editRating ?? ''}
                      onChange={(e) => setEditRating(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    >
                      <option value="">{t('notSpecified')}</option>
                      <option value={5}>★★★★★ (5)</option>
                      <option value={4}>★★★★☆ (4)</option>
                      <option value={3}>★★★☆☆ (3)</option>
                      <option value={2}>★★☆☆☆ (2)</option>
                      <option value={1}>★☆☆☆☆ (1)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">{t('genresComma')}</label>
                  <input
                    type="text"
                    value={editGenresText}
                    onChange={(e) => setEditGenresText(e.target.value)}
                    placeholder={t('placeholderGenres')}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">{t('coverImageUrl')}</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={editCoverUrl}
                      onChange={(e) => setEditCoverUrl(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelected}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Camera className="w-3.5 h-3.5" /> {t('takePhoto')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">{t('personalNotes')}</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> {t('saveChanges')}
                  </button>
                </div>
                {editError && <p role="alert" className="text-xs text-rose-300">{editError}</p>}
              </form>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-zinc-800">
            <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={() => setActiveTab('tracks')}
                className={`pb-3 px-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'tracks'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>{t('tabTracklist')} ({record.tracks?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('credits')}
                className={`pb-3 px-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'credits'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t('tabCredits')}</span>
              </button>

              <button
                onClick={() => setActiveTab('mycopy')}
                className={`pb-3 px-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'mycopy'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>{t('tabMyCopy')}</span>
              </button>

              <button
                onClick={() => setActiveTab('lending')}
                className={`pb-3 px-2 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-all ${
                  activeTab === 'lending'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>{t('tabLending')} {record.isLoaned && '📤'}</span>
              </button>
            </nav>
          </div>

          {/* Active Tab Panel */}
          <div>
            {activeTab === 'tracks' && <TracklistView tracks={record.tracks || []} />}
            {activeTab === 'credits' && (
              <TriviaCreditsView record={record} />
            )}
            {activeTab === 'mycopy' && (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block text-xs mb-1 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {t('purchasePrice')}
                    </span>
                    <span className="font-semibold text-zinc-200">
                      {record.purchasePrice !== undefined ? formatCurrency(record.purchasePrice, record.currency, language) : t('notRecorded')}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 block text-xs mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {t('dateAcquired')}
                    </span>
                    <span className="font-semibold text-zinc-200">{record.dateAcquired ? formatDateOnly(record.dateAcquired, language) : t('unknown')}</span>
                  </div>
                </div>

                {record.notes && (
                  <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 font-bold block mb-1">{t('personalNotes')}</span>
                    <p className="text-zinc-300 leading-relaxed">{record.notes}</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'lending' && (
              <LendingTab record={record} onRecordUpdated={onRecordUpdated} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
