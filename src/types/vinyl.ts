export type VinylFormat = '12" LP' | '10" EP' | '7" Single' | 'Gatefold' | 'Box Set' | '2xLP' | 'Other';
export type VinylSpeed = '33⅓ RPM' | '45 RPM' | '78 RPM';
export type GoldmineCondition = 'M' | 'NM' | 'VG+' | 'VG' | 'G+' | 'G' | 'F' | 'P';

export interface Track {
  id?: string;
  position: string; // e.g. "A1", "A2", "B1"
  title: string;
  duration?: string; // e.g. "4:12"
  credits?: string;
}

export interface Credit {
  role: string; // e.g. "Producer", "Mastering", "Drums"
  name: string;
}

export interface LoanRecord {
  id: string;
  borrowerName: string;
  borrowerContact?: string; // Phone or Email
  borrowedAt: string; // ISO date string
  expectedReturnAt: string; // ISO date string
  returnedAt?: string; // ISO date string if returned
  status: 'active' | 'overdue' | 'returned';
  notes?: string;
}

export interface VinylRecord {
  id: string; // UUID
  title: string;
  artist: string;
  releaseYear?: number;
  originalReleaseYear?: number;
  genres: string[];
  styles?: string[];
  label?: string;
  catalogNumber?: string;
  barcode?: string;
  country?: string;
  
  // Physical format details
  format: VinylFormat;
  speed: VinylSpeed;
  vinylColor?: string;
  pressingDetails?: string;
  mediaCondition?: GoldmineCondition | null;
  sleeveCondition?: GoldmineCondition | null;
  
  // Artwork
  coverImageUrl?: string;
  userPhotos?: string[]; // Custom camera snapshots
  
  // Content & Online metadata
  tracks: Track[];
  credits: Credit[];
  
  // Personal collection tracking
  dateAdded: string;
  dateAcquired?: string;
  purchasePrice?: number;
  currency?: string;
  rating?: number; // 1-5
  notes?: string;
  isFavorite?: boolean;
  tags?: string[];
  
  // Lending state
  isLoaned: boolean;
  currentLoan?: LoanRecord;
  loanHistory: LoanRecord[];
}

export interface DiscotecaBackupPayload {
  version: string;
  exportedAt: string;
  totalRecords: number;
  app: 'Discoteca';
  records: VinylRecord[];
}

export interface OnlineSearchResult {
  id: string; // MusicBrainz ID
  title: string;
  artist: string;
  year?: number;
  label?: string;
  country?: string;
  barcode?: string;
  trackCount?: number;
  format?: string;
  coverImageUrl?: string;
  score?: number;
}
