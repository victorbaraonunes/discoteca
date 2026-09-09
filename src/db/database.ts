import Dexie, { Table } from 'dexie';
import { VinylRecord } from '../types/vinyl';

interface DatabaseSetting {
  key: string;
  value: boolean;
}

export class DiscotecaDatabase extends Dexie {
  records!: Table<VinylRecord, string>;
  settings!: Table<DatabaseSetting, string>;

  constructor() {
    super('DiscotecaDB');
    this.version(1).stores({
      records: 'id, title, artist, releaseYear, isFavorite, isLoaned, dateAdded, *genres, *tags'
    });
    this.version(2).stores({
      records: 'id, title, artist, releaseYear, isFavorite, isLoaned, dateAdded, *genres, *tags',
      settings: 'key',
    });
    this.version(3)
      .stores({
        records: 'id, title, artist, releaseYear, isFavorite, isLoaned, dateAdded, *genres, *tags',
        settings: 'key',
      })
      .upgrade((transaction) => transaction.table('records').toCollection().modify((record) => {
        delete (record as { description?: unknown }).description;
      }));
    this.version(4)
      .stores({
        records: 'id, title, artist, releaseYear, isFavorite, isLoaned, dateAdded, *genres, *tags',
        settings: 'key',
      })
      .upgrade((transaction) => transaction.table('records').toCollection().modify((record) => {
        const legacyRecord = record as VinylRecord & { triviaFacts?: unknown };
        delete legacyRecord.triviaFacts;
        legacyRecord.credits = (legacyRecord.credits || []).filter(
          (credit) => !/^\s*\{\{|^\s*hlist\b/i.test(credit.name),
        );
      }));
    this.version(5)
      .stores({
        records: 'id, title, artist, releaseYear, isFavorite, isLoaned, dateAdded, *genres, *tags',
        settings: 'key',
      })
      .upgrade((transaction) => transaction.table('records').toCollection().modify((record) => {
        const legacyRecord = record as VinylRecord & { locationShelf?: unknown };
        delete legacyRecord.locationShelf;
        legacyRecord.genres = (legacyRecord.genres || []).filter((genre) => genre !== 'Vinyl');
      }));
  }
}

export const db = new DiscotecaDatabase();

// Initial sample collection for a rich starting experience
export const SAMPLE_RECORDS: VinylRecord[] = [
  {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    releaseYear: 1959,
    originalReleaseYear: 1959,
    genres: ['Jazz', 'Modal Jazz', 'Hard Bop'],
    styles: ['Modal'],
    label: 'Columbia Records',
    catalogNumber: 'CL 1355',
    country: 'United States',
    format: '12" LP',
    speed: '33⅓ RPM',
    vinylColor: 'Classic 180g Black',
    mediaCondition: 'NM',
    sleeveCondition: 'VG+',
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9c/MilesDavisKindofBlue.jpg',
    tracks: [
      { position: 'A1', title: 'So What', duration: '9:22', credits: 'Miles Davis' },
      { position: 'A2', title: 'Freddie Freeloader', duration: '9:46', credits: 'Miles Davis, Wynton Kelly on piano' },
      { position: 'A3', title: 'Blue in Green', duration: '5:37', credits: 'Miles Davis, Bill Evans' },
      { position: 'B1', title: 'All Blues', duration: '11:33', credits: 'Miles Davis' },
      { position: 'B2', title: 'Flamenco Sketches', duration: '9:26', credits: 'Miles Davis, Bill Evans' }
    ],
    credits: [
      { role: 'Trumpet / Bandleader', name: 'Miles Davis' },
      { role: 'Tenor Saxophone', name: 'John Coltrane' },
      { role: 'Alto Saxophone', name: 'Cannonball Adderley' },
      { role: 'Piano', name: 'Bill Evans / Wynton Kelly' },
      { role: 'Double Bass', name: 'Paul Chambers' },
      { role: 'Drums', name: 'Jimmy Cobb' },
      { role: 'Producer', name: 'Irving Townsend' },
      { role: 'Recording Engineer', name: 'Fred Plaut' }
    ],
    dateAdded: '2025-01-10T12:00:00.000Z',
    dateAcquired: '2024-11-15',
    purchasePrice: 38.00,
    currency: '$',
    rating: 5,
    isFavorite: true,
    notes: '2013 Mono reissue pressed at RTI. Dead silent background, breathtaking dynamics.',
    isLoaned: false,
    loanHistory: []
  },
  {
    id: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    title: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    releaseYear: 1973,
    originalReleaseYear: 1973,
    genres: ['Progressive Rock', 'Psychedelic Rock', 'Art Rock'],
    styles: ['Space Rock'],
    label: 'Harvest / EMI',
    catalogNumber: 'SHVL 804',
    country: 'United Kingdom',
    format: 'Gatefold',
    speed: '33⅓ RPM',
    vinylColor: 'Standard Black',
    mediaCondition: 'VG+',
    sleeveCondition: 'VG',
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png',
    tracks: [
      { position: 'A1', title: 'Speak to Me', duration: '1:07' },
      { position: 'A2', title: 'Breathe (In the Air)', duration: '2:49' },
      { position: 'A3', title: 'On the Run', duration: '3:45' },
      { position: 'A4', title: 'Time', duration: '6:53' },
      { position: 'A5', title: 'The Great Gig in the Sky', duration: '4:44' },
      { position: 'B1', title: 'Money', duration: '6:23' },
      { position: 'B2', title: 'Us and Them', duration: '7:49' },
      { position: 'B3', title: 'Any Colour You Like', duration: '3:26' },
      { position: 'B4', title: 'Brain Damage', duration: '3:46' },
      { position: 'B5', title: 'Eclipse', duration: '2:12' }
    ],
    credits: [
      { role: 'Bass / Vocals / Synth', name: 'Roger Waters' },
      { role: 'Guitars / Vocals', name: 'David Gilmour' },
      { role: 'Keyboards / Vocals', name: 'Richard Wright' },
      { role: 'Drums / Percussion', name: 'Nick Mason' },
      { role: 'Recording Engineer', name: 'Alan Parsons' },
      { role: 'Guest Vocals', name: 'Clare Torry' },
      { role: 'Sleeve Design', name: 'Hipgnosis / George Hardie' }
    ],
    dateAdded: '2025-01-12T14:30:00.000Z',
    dateAcquired: '2023-06-20',
    purchasePrice: 45.00,
    currency: '$',
    rating: 5,
    isFavorite: true,
    notes: 'Original UK gatefold with posters intact.',
    isLoaned: true,
    currentLoan: {
      id: 'loan-101',
      borrowerName: 'Alex Rivera',
      borrowerContact: 'alex.rivera@email.com / +1 (555) 349-8201',
      borrowedAt: '2026-08-20T10:00:00.000Z',
      expectedReturnAt: '2026-09-05T18:00:00.000Z',
      status: 'active',
      notes: 'Lent for a weekend vinyl listening party. Handle with anti-static brush!'
    },
    loanHistory: []
  },
  {
    id: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    title: 'Rumours',
    artist: 'Fleetwood Mac',
    releaseYear: 1977,
    originalReleaseYear: 1977,
    genres: ['Pop Rock', 'Soft Rock', 'Folk Rock'],
    styles: ['Classic Rock'],
    label: 'Warner Bros. Records',
    catalogNumber: 'BSK 3010',
    country: 'United States',
    format: '12" LP',
    speed: '33⅓ RPM',
    vinylColor: 'Clear Smoke Splatter',
    mediaCondition: 'M',
    sleeveCondition: 'NM',
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.PNG',
    tracks: [
      { position: 'A1', title: 'Second Hand News', duration: '2:43' },
      { position: 'A2', title: 'Dreams', duration: '4:14' },
      { position: 'A3', title: 'Never Going Back Again', duration: '2:14' },
      { position: 'A4', title: 'Don\'t Stop', duration: '3:11' },
      { position: 'A5', title: 'Go Your Own Way', duration: '3:38' },
      { position: 'A6', title: 'Songbird', duration: '3:20' },
      { position: 'B1', title: 'The Chain', duration: '4:28' },
      { position: 'B2', title: 'You Make Loving Fun', duration: '3:31' },
      { position: 'B3', title: 'I Don\'t Want to Know', duration: '3:11' },
      { position: 'B4', title: 'Oh Daddy', duration: '3:54' },
      { position: 'B5', title: 'Gold Dust Woman', duration: '4:51' }
    ],
    credits: [
      { role: 'Vocals / Keyboards', name: 'Christine McVie' },
      { role: 'Vocals', name: 'Stevie Nicks' },
      { role: 'Guitars / Vocals / Producer', name: 'Lindsey Buckingham' },
      { role: 'Bass Guitar', name: 'John McVie' },
      { role: 'Drums / Percussion', name: 'Mick Fleetwood' },
      { role: 'Producer / Sound Engineer', name: 'Ken Caillat & Richard Dashut' }
    ],
    dateAdded: '2025-02-01T09:15:00.000Z',
    dateAcquired: '2024-04-10',
    purchasePrice: 32.50,
    currency: '$',
    rating: 5,
    isFavorite: false,
    notes: 'Mastered by Kevin Gray at Cohearent Audio. Beautiful clarity on Stevie\'s vocals.',
    isLoaned: false,
    loanHistory: []
  },
  {
    id: 'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a',
    title: 'Random Access Memories',
    artist: 'Daft Punk',
    releaseYear: 2013,
    originalReleaseYear: 2013,
    genres: ['Electronic', 'Disco', 'Funk', 'Synth-Pop'],
    styles: ['Nu-Disco'],
    label: 'Columbia Records / Daft Life',
    catalogNumber: '88883716861',
    country: 'France / United States',
    format: '2xLP',
    speed: '33⅓ RPM',
    vinylColor: '180g Heavyweight Black',
    mediaCondition: 'M',
    sleeveCondition: 'M',
    coverImageUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg',
    tracks: [
      { position: 'A1', title: 'Give Life Back to Music', duration: '4:34' },
      { position: 'A2', title: 'The Game of Love', duration: '5:21' },
      { position: 'A3', title: 'Giorgio by Moroder', duration: '9:04' },
      { position: 'B1', title: 'Within', duration: '3:48' },
      { position: 'B2', title: 'Instant Crush (feat. Julian Casablancas)', duration: '5:37' },
      { position: 'B3', title: 'Lose Yourself to Dance (feat. Pharrell Williams)', duration: '5:53' },
      { position: 'C1', title: 'Touch (feat. Paul Williams)', duration: '8:18' },
      { position: 'C2', title: 'Get Lucky (feat. Pharrell Williams & Nile Rodgers)', duration: '6:09' },
      { position: 'C3', title: 'Beyond', duration: '4:50' },
      { position: 'D1', title: 'Motherboard', duration: '5:41' },
      { position: 'D2', title: 'Fragments of Time (feat. Todd Edwards)', duration: '4:39' },
      { position: 'D3', title: 'Doin\' It Right (feat. Panda Bear)', duration: '4:11' },
      { position: 'D4', title: 'Contact', duration: '6:21' }
    ],
    credits: [
      { role: 'Keyboards / Vocals / Production', name: 'Thomas Bangalter & Guy-Manuel de Homem-Christo' },
      { role: 'Guitar', name: 'Nile Rodgers / Paul Jackson Jr.' },
      { role: 'Bass', name: 'Nathan East / James Genus' },
      { role: 'Drums', name: 'Omar Hakim / John "JR" Robinson' },
      { role: 'Guest Vocals', name: 'Pharrell Williams / Julian Casablancas' },
      { role: 'Sound Engineer', name: 'Mick Guzauski' },
      { role: 'Mastering Engineer', name: 'Bob Ludwig' }
    ],
    dateAdded: '2025-02-10T16:45:00.000Z',
    dateAcquired: '2024-12-25',
    purchasePrice: 42.00,
    currency: '$',
    rating: 5,
    isFavorite: true,
    notes: 'Audiophile grade pressing with foil-stamped gatefold. Incredible bass depth.',
    isLoaned: false,
    loanHistory: []
  }
];

export async function initDatabase(): Promise<void> {
  await db.transaction('rw', db.records, db.settings, async () => {
    const initialized = await db.settings.get('hasInitialized');

    if (initialized?.value) return;

    const count = await db.records.count();
    if (count === 0) {
      await db.records.bulkAdd(SAMPLE_RECORDS);
    }

    await db.settings.put({ key: 'hasInitialized', value: true });
  });
}
