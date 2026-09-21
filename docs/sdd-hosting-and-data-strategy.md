# SDD: publishing and collection data strategy

## Status

Proposed. No implementation changes are included in this document.

## Context

Discoteca is a Vite single-page application. Its current `Dexie` database is
backed by IndexedDB, which is **persistent local browser storage**, not
in-memory state. A record remains after a reload or browser restart unless the
user clears site data or removes it in the app.

The important limitation is scope: IndexedDB belongs to one browser profile and
one origin. The collection in Safari on an iPhone, Chrome on a Mac, and a local
development URL are independent databases. Publishing on GitHub Pages would
give the app one stable production origin, but it would not synchronize
collections across devices.

## Decision

### Hosting

Publish the Vite frontend on GitHub Pages from the `main` branch through a
dedicated GitHub Actions deployment workflow.

The GitHub Pages deployment must set Vite's production base path to
`/discoteca/`, while local development keeps `/`. This prevents JavaScript,
CSS, and image asset URLs from breaking at
`https://victorbaraonunes.github.io/discoteca/`.

GitHub Pages is a public website even when the source repository is private.
Furthermore, GitHub Free supports Pages only from public repositories; private
repositories require a plan that includes private-repository Pages. Before this
phase, confirm the account plan and that publishing the frontend source is
acceptable. Collection data must never be committed to the repository.

### Data, first release

Keep Dexie/IndexedDB as the local-first database for the initial Pages launch.
It already supports offline use, is mature in this project, and retains the
existing migration history and backup/import workflow. Replacing it with SQLite
in the browser would not solve cross-device access: browser SQLite/WASM is also
stored locally per device and adds significant bundle, worker, and migration
complexity.

### Data, sync release

If the goal is one collection shared by iPhone and Mac, introduce a hosted
SQLite-compatible database behind an authenticated API. The recommended
direction is:

```text
GitHub Pages (React UI)
        |
        | HTTPS, authenticated requests
        v
Cloudflare Worker (API + authorization)
        |
        +--> Cloudflare D1 (SQLite-compatible collection data)
        +--> Cloudflare R2 (optional user photos)
```

Cloudflare D1 gives the desired SQLite model on the server. GitHub Pages cannot
host an API or database, so D1 requires the Worker. D1/R2 credentials stay in
Cloudflare secrets and are never shipped to the browser.

Keep IndexedDB as a local cache/offline queue in this phase. The Worker becomes
the source of truth after a successful sync. This allows a gradual migration and
keeps the app usable while offline.

## Goals

1. Give the app a stable public URL through GitHub Pages.
2. Preserve every existing local record during the first deployment.
3. Avoid a SQLite migration that does not deliver cross-device synchronization.
4. Provide a safe path to one private, synchronized collection on iPhone and
   Mac.
5. Keep export/import as a recovery mechanism even after cloud sync exists.

## Non-goals

- No anonymous public write API.
- No migration of existing browser records without a user-visible backup and
  confirmation step.
- No storing camera photo data URLs directly in D1.
- No replacement of the current backup/export UI in the Pages-only release.

## User journeys

### Phase 1: GitHub Pages with local collection

1. User opens the Pages URL on a device.
2. The app loads and initializes IndexedDB for that Pages origin.
3. The user creates, edits, exports, or imports a collection as today.
4. The user understands that another device begins with its own collection;
   JSON export/import is the temporary transfer path.

### Phase 2: first synchronized sign-in

1. User signs in with the selected identity provider.
2. If a local IndexedDB collection exists and cloud data is empty, the app shows
   a summary and asks whether to upload it.
3. The app uploads records in a transaction-like, resumable batch.
4. The server returns record identifiers and revision timestamps.
5. Subsequent edits sync in the background; offline edits remain queued until
   connectivity returns.

### Conflict handling

1. Every record carries `updatedAt`, `deletedAt` (for tombstones), and a
   revision/version.
2. The client sends the last known revision when updating a record.
3. A mismatch returns a conflict rather than silently overwriting another
   device's edit.
4. The first release can offer explicit **keep mine** / **keep cloud** choices;
   automatic last-write-wins should be used only for fields where it is clearly
   acceptable.

## Data model proposal for the sync release

### Server tables

- `users`: authenticated account identifier and timestamps.
- `records`: record JSON or normalized record fields, owner ID, revision,
  `created_at`, `updated_at`, `deleted_at`.
- `photos`: owner ID, record ID, R2 object key, MIME type, size, timestamps.
- `sync_changes` (optional): append-only change feed for efficient multi-device
  synchronization.

Tracks, credits, genres, tags, and lending history may initially remain inside a
validated `record_json` column. This keeps migration low-risk. Normalize only
when a product feature needs server-side filtering or reporting by those values.

### Photos

Current camera images are data URLs inside record data. In the sync release,
upload image bytes to R2 and store only a photo key/URL in the record. Enforce
file type and size limits before upload.

## Security and privacy requirements

- Require authentication for every collection API request.
- Authorize every read and write by owner ID in the Worker; never trust an ID
  supplied by the client alone.
- Store worker/database/object-storage credentials only as deployment secrets.
- Rate-limit mutation endpoints and validate record payloads on the server.
- Keep the GitHub repository private; deployment visibility and any app sign-in
  policy must be decided before releasing shared data.
- Retain JSON export and add a clear account-data deletion path before the sync
  release is considered complete.

## Delivery plan

### Phase 0 — baseline and recovery

1. Verify `npm test`, `npm run typecheck`, and `npm run build` in CI.
2. Make a JSON backup from each current device before changing its storage
   behavior.
3. Add a small in-app explanation that local storage is device-specific.

### Phase 1 — GitHub Pages deployment

1. Configure Vite's production `base` path for `/discoteca/`.
2. Add a Pages workflow that installs with `npm ci`, runs typecheck/tests/build,
   uploads `dist`, and deploys only after verification passes.
3. Enable GitHub Pages with **GitHub Actions** as the source.
4. Test the URL on desktop and iPhone:
   - asset loading and page refresh;
   - local record creation and persistence;
   - MusicBrainz/Cover Art requests under HTTPS;
   - camera, QR scanning, import, and export.
5. Document that the Pages release does not sync data between devices.

### Phase 2 — authentication and cloud foundation

1. Choose an identity provider and access policy. For a personal application,
   a single permitted account is the simplest launch scope.
2. Provision Cloudflare Worker, D1, and R2 (only if photo upload is enabled).
3. Define OpenAPI-style request/response contracts and D1 migrations.
4. Add Worker unit tests for authentication, ownership, validation, and
   conflict responses.

### Phase 3 — client migration and synchronization

1. Introduce a repository/data-access interface so React components no longer
   call Dexie directly.
2. Implement the local Dexie adapter first, then the sync adapter behind a
   feature flag.
3. Add one-time import from the existing `DiscotecaDB` IndexedDB database with
   preview, backup, confirmation, retry, and idempotency.
4. Add offline queue, revision checks, conflict UI, and sync status indicators.
5. Move user photos to R2 and migrate existing data URLs only after explicit
   confirmation.

### Phase 4 — release hardening

1. Test two-device add/edit/delete and conflict scenarios.
2. Test offline edits followed by reconnection.
3. Test account isolation with a second test account.
4. Add monitoring, backup policy, data export, and deletion verification.

## Acceptance criteria

### GitHub Pages

- Pages serves the application with no broken production asset paths.
- The deployment workflow blocks publication when typecheck, tests, or build
  fail.
- A collection persists after refresh on the same browser/device.
- The UI accurately describes the device-local limitation.

### Sync release

- The authorized user sees the same collection on iPhone and Mac after sync.
- An unauthenticated request cannot read or change collection data.
- Existing local data is backed up and explicitly approved before migration.
- Conflicting edits are surfaced, never silently discarded.
- Photos are stored outside the SQLite database.

## Open decisions

1. Should the Pages site be public but require sign-in for collection data, or
   restricted to a single account from the outset?
2. Does the GitHub account plan permit Pages from this private repository, or
   should the repository be made public to use Pages?
3. Which identity provider should protect the Worker API?
4. Is cross-device synchronization needed immediately, or is JSON transfer
   acceptable while the hosted frontend is validated?
5. Should user-taken cover photos sync in the first cloud release, given their
   storage and privacy implications?

## Recommendation

Implement Phase 1 now and keep Dexie. Do not migrate to browser SQLite. Begin
the D1/Worker synchronization work only after the Pages version is validated
and the authentication/access decision is made.
