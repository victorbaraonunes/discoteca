import { OnlineSearchResult, Track, Credit, VinylFormat } from '../types/vinyl';

const MB_BASE_URL = 'https://musicbrainz.org/ws/2';
const CAA_BASE_URL = 'https://coverartarchive.org/release';
const MIN_REQUEST_INTERVAL_MS = 1100;
let nextMusicBrainzRequestAt = 0;

export interface MusicBrainzReleaseDetails {
  id: string;
  title: string;
  artist: string;
  releaseYear?: number;
  label?: string;
  catalogNumber?: string;
  country?: string;
  barcode?: string;
  format: VinylFormat;
  coverImageUrl?: string;
  tracks: Track[];
  credits: Credit[];
  genres: string[];
}

export interface MusicBrainzSearchOptions {
  artist?: string;
  title?: string;
  catalogNumber?: string;
  barcode?: string;
  preferBrazil?: boolean;
}

function quoteSearchValue(value: string): string {
  return `"${value.trim().replace(/["\\]/g, '\\$&')}"`;
}

export function buildReleaseQuery(options: MusicBrainzSearchOptions, includeBrazil: boolean): string {
  const clauses: string[] = [];
  if (options.barcode?.trim()) clauses.push(`barcode:${quoteSearchValue(options.barcode)}`);
  if (options.catalogNumber?.trim()) clauses.push(`catno:${quoteSearchValue(options.catalogNumber)}`);
  if (options.artist?.trim()) clauses.push(`artist:${quoteSearchValue(options.artist)}`);
  if (options.title?.trim()) clauses.push(`release:${quoteSearchValue(options.title)}`);
  if (includeBrazil) clauses.push('country:BR');
  return clauses.join(' AND ');
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Search cancelled', 'AbortError');
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timeout);
      reject(new DOMException('Search cancelled', 'AbortError'));
    }, { once: true });
  });
}

async function waitForMusicBrainzSlot(signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);
  const now = Date.now();
  const requestAt = Math.max(now, nextMusicBrainzRequestAt);
  nextMusicBrainzRequestAt = requestAt + MIN_REQUEST_INTERVAL_MS;
  if (requestAt > now) await wait(requestAt - now, signal);
  throwIfAborted(signal);
}

async function fetchMusicBrainz(url: string, signal?: AbortSignal): Promise<Response> {
  let lastResponse: Response | undefined;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await waitForMusicBrainzSlot(signal);
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal });
    if (response.ok) return response;

    lastResponse = response;
    if (![429, 502, 503].includes(response.status) || attempt === 2) break;

    const retryAfterSeconds = Number(response.headers.get('Retry-After'));
    await wait(Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : MIN_REQUEST_INTERVAL_MS, signal);
  }

  throw new Error(`MusicBrainz request failed: ${lastResponse?.status || 'network error'}`);
}

async function searchReleases(query: string, signal?: AbortSignal): Promise<OnlineSearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `${MB_BASE_URL}/release/?query=${encodedQuery}&fmt=json&limit=15`;
  const response = await fetchMusicBrainz(url, signal);

  const data = await response.json();
  return (data.releases || []).map((rel: any) => {
    const artistCredit = rel['artist-credit']?.[0]?.name || rel['artist-credit']?.[0]?.artist?.name || 'Unknown Artist';
    const year = rel.date ? parseInt(rel.date.substring(0, 4), 10) : undefined;
    const label = rel['label-info-list']?.[0]?.label?.name;
    const media = rel.media?.[0];
    return {
      id: rel.id,
      title: rel.title,
      artist: artistCredit,
      year,
      label,
      country: rel.country,
      barcode: rel.barcode,
      format: media?.format || 'Vinyl',
      trackCount: rel['track-count'] || media?.['track-count'],
      coverImageUrl: `${CAA_BASE_URL}/${rel.id}/front-250`,
      score: rel.score,
    };
  });
}

export async function searchMusicBrainz(options: MusicBrainzSearchOptions, signal?: AbortSignal): Promise<OnlineSearchResult[]> {
  const hasSearchTerm = Object.values(options).some((value) => typeof value === 'string' && value.trim());
  if (!hasSearchTerm) return [];

  const brazilQuery = buildReleaseQuery(options, options.preferBrazil === true);
  const brazilResults = await searchReleases(brazilQuery, signal);
  if (brazilResults.length > 0 || !options.preferBrazil) return brazilResults;

  return searchReleases(buildReleaseQuery(options, false), signal);
}

export async function searchByBarcode(barcode: string): Promise<OnlineSearchResult[]> {
  return searchMusicBrainz({ barcode });
}

export async function fetchMusicBrainzDetails(releaseId: string): Promise<MusicBrainzReleaseDetails | null> {
  try {
    const url = `${MB_BASE_URL}/release/${releaseId}?inc=recordings+artist-credits+labels+media+release-groups+genres+tags&fmt=json`;
    
    const response = await fetchMusicBrainz(url);

    const data = await response.json();
    
    const artist = data['artist-credit']?.map((ac: any) => ac.name || ac.artist?.name).join(' ') || 'Unknown Artist';
    const year = data.date ? parseInt(data.date.substring(0, 4), 10) : undefined;
    const label = data['label-info-list']?.[0]?.label?.name;
    const catalogNumber = data['label-info-list']?.[0]?.['catalog-number'];
    const country = data.country;
    const barcode = data.barcode;

    // Detect format
    let format: VinylFormat = '12" LP';
    const mediaList = data.media || [];
    if (mediaList.length > 1) {
      format = '2xLP';
    } else if (mediaList[0]?.format?.includes('7"')) {
      format = '7" Single';
    } else if (mediaList[0]?.format?.includes('10"')) {
      format = '10" EP';
    }

    // Parse tracks across media sides (Side A, Side B, Side C, etc.)
    const tracks: Track[] = [];
    mediaList.forEach((medium: any, mediumIndex: number) => {
      const sidePrefix = mediaList.length > 1
        ? mediumIndex === 0 ? 'A' : mediumIndex === 1 ? 'B' : mediumIndex === 2 ? 'C' : 'D'
        : 'A';
      
      const trackList = medium.tracks || [];
      trackList.forEach((t: any, tIndex: number) => {
        let position = t.number;
        if (!position || !isNaN(Number(position))) {
          // If numeric, assign A1, A2... or split between sides if single disc
          if (trackList.length > 6 && mediaList.length === 1) {
            const half = Math.ceil(trackList.length / 2);
            if (tIndex < half) {
              position = `A${tIndex + 1}`;
            } else {
              position = `B${tIndex - half + 1}`;
            }
          } else {
            position = `${sidePrefix}${tIndex + 1}`;
          }
        }

        const durationMs = t.length || t.recording?.length;
        let duration = '';
        if (durationMs) {
          const totalSec = Math.floor(durationMs / 1000);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }

        const trackCredits = t['artist-credit']?.map((ac: any) => ac.name).join(', ');

        tracks.push({
          position,
          title: t.title || t.recording?.title || `Track ${tIndex + 1}`,
          duration: duration || undefined,
          credits: trackCredits || undefined,
        });
      });
    });

    // Extract tags/genres
    const genres: string[] = [];
    const tags = [...(data.tags || []), ...(data['release-group']?.tags || [])];
    tags.forEach((tag: any) => {
      if (tag.name && !genres.includes(tag.name)) {
        // Capitalize tag
        const formatted = tag.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        genres.push(formatted);
      }
    });

    const credits: Credit[] = [];
    if (artist) {
      credits.push({ role: 'Primary Artist', name: artist });
    }
    if (label) {
      credits.push({ role: 'Record Label', name: label });
    }

    return {
      id: data.id,
      title: data.title,
      artist,
      releaseYear: year,
      label,
      catalogNumber,
      country,
      barcode,
      format,
      coverImageUrl: `${CAA_BASE_URL}/${data.id}/front-500`,
      tracks,
      credits,
      genres: genres.slice(0, 5),
    };
  } catch (error) {
    console.error('Error fetching MusicBrainz release details:', error);
    return null;
  }
}
