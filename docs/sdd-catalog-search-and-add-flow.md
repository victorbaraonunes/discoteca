# SDD: Brazilian catalog search and reliable record creation

## Status

Implemented locally and verified. This scope uses MusicBrainz only.

## Problem statement

The original MusicBrainz lookup submitted one loose combined query, which missed many Brazilian releases. The manual form also had untranslated text and could fail silently on an iPhone using the local HTTP address because it called `crypto.randomUUID()` directly.

## Goals

1. Make manual record creation reliable on desktop and iPhone over local HTTP.
2. Translate the add wizard in English and Brazilian Portuguese.
3. Keep the initial manual-entry experience short, moving optional metadata out of the main path.
4. Improve MusicBrainz matching for Brazilian releases.

## User journeys

### Manual entry

1. User enters album title and artist, then optionally year, format, speed, condition, location, and price.
2. Optional metadata—label, catalog number, barcode, genres, rating, notes, description, artwork URL, and tracklist—is in **More details (optional)**.
3. The user saves once. The form shows progress, closes only on success, and preserves values with a translated error on failure.

### Brazilian release lookup

1. User searches with artist and/or title, catalog number, or barcode.
2. **Prefer Brazilian pressings** is enabled by default and remembered locally.
3. MusicBrainz receives a structured query, such as `artist:"..." AND release:"..." AND country:BR`.
4. A zero-result Brazilian search automatically retries worldwide.

## Requirements

- Use the existing `generateUUID()` fallback in add, import, and lending flows.
- Add translated validation and persistence-error feedback to manual saves.
- Localize all visible manual-form labels, actions, conditions, and examples.
- Keep catalog number and barcode empty by default; only show localized examples.
- Default the manual-entry currency to BRL under Brazilian Portuguese, with an explicit BRL/USD selector.
- Search MusicBrainz with structured `artist`, `release`, `catno`, and `barcode` fields.
- Prefer `country:BR`, then retry without the country filter when needed.

## Verification

- Unit tests cover the UUID fallback and structured Brazilian query creation.
- `npm test` and `npm run build` must pass.
- Manually confirm record saving at `http://<mac-ip>:3000` from an iPhone.
