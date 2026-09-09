# 🎵 Discoteca — Vinyl Record Collection & Loan Tracker SPA

A lightweight, modern Single Page Application (SPA) designed for mobile smartphones and desktop web browsers to catalog, track, enrich, and manage lending for personal vinyl record collections.

---

## ✨ Features

- **📱 Mobile & PC Responsive**: Built with responsive design, tactile vinyl crate aesthetics, vinyl groove peek animations, and dark mode.
- **📸 Add Records with Camera & AI**:
  - Snap/upload photos of album sleeves, vinyl labels, or back covers.
  - Optional Gemini AI Vision recognition to auto-extract artist, album title, tracklist, and trivia.
- **🌐 Online Metadata & Wikipedia Enrichment**:
  - **MusicBrainz Web Service** & **Cover Art Archive** integration for instant verified tracklists (Side A/Side B), release dates, record labels, and high-res artwork.
  - **Wikipedia REST API** integration for album background history, recording trivia, and technical personnel credits (producers, engineers, musicians).
- **🤝 Lending & Borrowing System**:
  - Track who borrowed your records with contact information, scheduled return date & time, and overdue detection.
  - **QR Code Generation**: Generates scannable QR passes for each record and printable loan receipts.
  - **Integrated Camera Scanner**: Scan QR codes or barcodes with your smartphone or webcam to instantly look up records or check in returns with 1 tap.
- **💾 100% Offline & Private (IndexedDB)**:
  - Stores all records locally in your browser with Dexie.js (no database account or server required).
  - **Backup & Restore (JSON)**: Export your entire database to a JSON file and import/merge anytime.
  - **Spreadsheet Export (CSV)**: Export your collection to Excel / Google Sheets.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or pnpm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

The application will run at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm run preview
```

### Running Tests

```bash
npm test
```

---

## 🛠️ Technology Stack

- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: Dexie.js (IndexedDB wrapper)
- **QR & Barcodes**: `qrcode.react`, `html5-qrcode`
- **APIs**: MusicBrainz API, Cover Art Archive, Wikipedia REST API, optional Google Gemini API
- **Testing**: Vitest
