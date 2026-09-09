import { db } from '../db/database';
import { DiscotecaBackupPayload, VinylRecord } from '../types/vinyl';
import { generateUUID } from '../utils/formatters';

export async function exportCollectionToJson(): Promise<void> {
  const records = await db.records.toArray();
  const payload: DiscotecaBackupPayload = {
    version: '1.0.0',
    app: 'Discoteca',
    exportedAt: new Date().toISOString(),
    totalRecords: records.length,
    records,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `discoteca_vinyl_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportCollectionToCsv(): Promise<void> {
  const records = await db.records.toArray();
  
  const headers = [
    'ID',
    'Artist',
    'Title',
    'Release Year',
    'Format',
    'Speed',
    'Color',
    'Media Condition',
    'Sleeve Condition',
    'Label',
    'Catalog #',
    'Barcode',
    'Genres',
    'Track Count',
    'Purchase Price',
    'Rating',
    'Is Favorite',
    'Is Loaned',
    'Current Borrower',
    'Expected Return',
    'Date Added'
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map(r => [
    escapeCsv(r.id),
    escapeCsv(r.artist),
    escapeCsv(r.title),
    escapeCsv(r.releaseYear || ''),
    escapeCsv(r.format),
    escapeCsv(r.speed),
    escapeCsv(r.vinylColor || ''),
    escapeCsv(r.mediaCondition),
    escapeCsv(r.sleeveCondition),
    escapeCsv(r.label || ''),
    escapeCsv(r.catalogNumber || ''),
    escapeCsv(r.barcode || ''),
    escapeCsv((r.genres || []).join(', ')),
    escapeCsv(r.tracks?.length || 0),
    escapeCsv(r.purchasePrice ? `${r.currency || '$'}${r.purchasePrice}` : ''),
    escapeCsv(r.rating || ''),
    escapeCsv(r.isFavorite ? 'Yes' : 'No'),
    escapeCsv(r.isLoaned ? 'Yes' : 'No'),
    escapeCsv(r.currentLoan?.borrowerName || ''),
    escapeCsv(r.currentLoan?.expectedReturnAt || ''),
    escapeCsv(r.dateAdded)
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `discoteca_collection_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  message: string;
}

export async function importCollectionFromJson(
  jsonText: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<ImportResult> {
  try {
    const data = JSON.parse(jsonText);
    
    // Support both direct array or backup payload envelope
    let recordsToImport: VinylRecord[] = [];
    if (Array.isArray(data)) {
      recordsToImport = data;
    } else if (data.records && Array.isArray(data.records)) {
      recordsToImport = data.records;
    } else {
      throw new Error('Invalid JSON format: could not find array of vinyl records.');
    }

    if (recordsToImport.length === 0) {
      return { success: false, importedCount: 0, message: 'The backup file contains 0 records.' };
    }

    // Validate and sanitize records
    const sanitized: VinylRecord[] = recordsToImport.map(r => {
      const { locationShelf: _locationShelf, ...recordWithoutShelf } = r as VinylRecord & { locationShelf?: unknown };
      return {
        ...recordWithoutShelf,
        id: r.id || generateUUID(),
        title: r.title || 'Untitled',
        artist: r.artist || 'Unknown Artist',
        format: r.format || '12" LP',
        speed: r.speed || '33⅓ RPM',
        mediaCondition: r.mediaCondition ?? null,
        sleeveCondition: r.sleeveCondition ?? null,
        genres: Array.isArray(r.genres) ? r.genres.filter((genre) => genre !== 'Vinyl') : [],
        tracks: Array.isArray(r.tracks) ? r.tracks : [],
        credits: Array.isArray(r.credits) ? r.credits : [],
        isLoaned: !!r.isLoaned,
        loanHistory: Array.isArray(r.loanHistory) ? r.loanHistory : [],
        dateAdded: r.dateAdded || new Date().toISOString(),
      };
    });

    if (mode === 'replace') {
      await db.records.clear();
      await db.records.bulkAdd(sanitized);
    } else {
      await db.records.bulkPut(sanitized);
    }

    return {
      success: true,
      importedCount: sanitized.length,
      message: `Successfully imported ${sanitized.length} records (${mode === 'replace' ? 'replaced existing collection' : 'merged with existing records'}).`,
    };
  } catch (error: any) {
    console.error('Import failed:', error);
    return {
      success: false,
      importedCount: 0,
      message: error.message || 'Failed to parse or import JSON backup file.',
    };
  }
}
