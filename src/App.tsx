import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initDatabase } from './db/database';
import { VinylRecord } from './types/vinyl';
import { isLoanOverdue } from './utils/formatters';
import { Header } from './components/layout/Header';
import { StatsBar } from './components/layout/StatsBar';
import { FilterBar, FilterTab, SortOption } from './components/collection/FilterBar';
import { RecordGrid } from './components/collection/RecordGrid';
import { RecordDetailModal } from './components/record-detail/RecordDetailModal';
import { AddRecordModal } from './components/add-record/AddRecordModal';
import { QRScannerModal } from './components/scanner/QRScannerModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { LanguageProvider } from './i18n/LanguageContext';
import { Plus } from 'lucide-react';

function AppContent() {
  // Initialize Database
  useEffect(() => {
    initDatabase().catch(console.error);
  }, []);

  // Live Query from IndexedDB
  const rawRecords = useLiveQuery(() => db.records.toArray(), []);
  const records = useMemo(() => rawRecords || [], [rawRecords]);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<VinylRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync selectedRecord when records list updates
  useEffect(() => {
    if (selectedRecord) {
      const refreshed = records.find((r) => r.id === selectedRecord.id);
      if (refreshed) {
        setSelectedRecord(refreshed);
      }
    }
  }, [records]);

  // Extract all available genres across records for the dropdown filter
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    records.forEach((r) => {
      (r.genres || []).forEach((g) => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
  }, [records]);

  // Filter & Sort Logic
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.artist.toLowerCase().includes(q) ||
          (r.label && r.label.toLowerCase().includes(q)) ||
          (r.catalogNumber && r.catalogNumber.toLowerCase().includes(q)) ||
          (r.genres && r.genres.some((g) => g.toLowerCase().includes(q))) ||
          (r.tracks && r.tracks.some((t) => t.title.toLowerCase().includes(q))) ||
          (r.currentLoan?.borrowerName && r.currentLoan.borrowerName.toLowerCase().includes(q))
      );
    }

    // 2. Primary Tabs
    if (activeTab === 'favorites') {
      result = result.filter((r) => r.isFavorite);
    } else if (activeTab === 'loaned') {
      result = result.filter((r) => r.isLoaned);
    } else if (activeTab === 'overdue') {
      result = result.filter((r) => r.isLoaned && isLoanOverdue(r.currentLoan?.expectedReturnAt));
    }

    // 3. Genre Filter
    if (selectedGenre) {
      result = result.filter((r) => (r.genres || []).includes(selectedGenre));
    }

    // 4. Format Filter
    if (selectedFormat) {
      result = result.filter((r) => r.format === selectedFormat);
    }

    // 5. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'artist-asc':
          return a.artist.localeCompare(b.artist);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'year-desc':
          return (b.releaseYear || 0) - (a.releaseYear || 0);
        case 'year-asc':
          return (a.releaseYear || 9999) - (b.releaseYear || 9999);
        case 'recent':
        default:
          return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime();
      }
    });

    return result;
  }, [records, searchQuery, activeTab, selectedGenre, selectedFormat, sortBy]);

  // Handlers
  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = records.find((r) => r.id === id);
    if (!target) return;
    await db.records.update(id, { isFavorite: !target.isFavorite });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setSelectedGenre('');
    setSelectedFormat('');
  };

  const handleRecordFoundFromScanner = (record: VinylRecord) => {
    setSelectedRecord(record);
  };

  const handleBarcodeFoundFromScanner = (barcode: string) => {
    setSearchQuery(barcode);
  };

  const loanedCount = useMemo(() => records.filter((r) => r.isLoaned).length, [records]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0e0b0d] text-zinc-100 selection:bg-rose-700 selection:text-white">
      {/* Header Bar */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        loanedCount={loanedCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Collection Statistics */}
        <StatsBar
          records={records}
          activeFilterTab={activeTab}
          onSelectFilter={(tab) => setActiveTab(tab)}
        />

        {/* Filter & Sort Bar */}
        <FilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          allGenres={allGenres}
          selectedFormat={selectedFormat}
          onFormatChange={setSelectedFormat}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalCount={records.length}
          filteredCount={filteredRecords.length}
        />

        {/* Record Cards Grid */}
        <RecordGrid
          records={filteredRecords}
          onSelectRecord={(rec) => setSelectedRecord(rec)}
          onToggleFavorite={handleToggleFavorite}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
          hasFiltersActive={!!(selectedGenre || selectedFormat || activeTab !== 'all')}
        />
      </main>

      {/* Mobile Floating Action Button (Add Record) */}
      <div className="sm:hidden fixed bottom-5 right-5 z-20">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-600 to-rose-800 text-white shadow-xl shadow-rose-900/50 flex items-center justify-center active:scale-95 transition-all"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* Modals */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onRecordUpdated={(updated) => setSelectedRecord(updated)}
          onRecordDeleted={() => setSelectedRecord(null)}
          onToggleFavorite={(id, e) => handleToggleFavorite(id, e)}
        />
      )}

      {isAddModalOpen && (
        <AddRecordModal
          onClose={() => setIsAddModalOpen(false)}
          onRecordAdded={(newRec) => {
            setSelectedRecord(newRec);
          }}
        />
      )}

      {isScannerOpen && (
        <QRScannerModal
          onClose={() => setIsScannerOpen(false)}
          onRecordFound={handleRecordFoundFromScanner}
          onBarcodeFound={handleBarcodeFoundFromScanner}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;

