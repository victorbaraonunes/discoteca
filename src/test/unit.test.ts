import { describe, it, expect, vi, afterEach } from 'vitest';
import { isLoanOverdue, getConditionBadge, formatCurrency, formatDateForForm, formatDateOnly, formatDateTime, generateUUID, parseDateFromForm } from '../utils/formatters';
import { SAMPLE_RECORDS } from '../db/database';
import { buildReleaseQuery } from '../services/musicBrainzService';

afterEach(() => vi.unstubAllGlobals());

describe('Discoteca Utilities & Business Logic', () => {
  it('should correctly detect overdue loans', () => {
    // Past date (overdue)
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString();
    expect(isLoanOverdue(pastDate)).toBe(true);

    // Future date (not overdue)
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
    expect(isLoanOverdue(futureDate)).toBe(false);

    // Undefined date
    expect(isLoanOverdue(undefined)).toBe(false);
  });

  it('should return appropriate Goldmine condition badges', () => {
    const mint = getConditionBadge('M', 'en');
    expect(mint.label).toBe('M');
    expect(mint.full).toBe('Mint');
    expect(mint.color).toContain('emerald');

    const vgPlus = getConditionBadge('VG+', 'en');
    expect(vgPlus.label).toBe('VG+');
    expect(vgPlus.full).toBe('Very Good Plus');

    const poor = getConditionBadge('P', 'en');
    expect(poor.label).toBe('P');
    expect(poor.full).toBe('Poor');
  });

  it('should format dates and times correctly', () => {
    const testIso = '2026-08-29T18:00:00.000Z';
    const formatted = formatDateTime(testIso);
    expect(formatted).toBeTruthy();
    expect(formatted).not.toBe('—');
    expect(formatDateOnly('2026-04-08', 'pt-BR')).toContain('08');
    expect(formatDateOnly('2026-04-08', 'pt-BR')).toContain('2026');
    expect(formatCurrency(180, 'BRL', 'pt-BR')).toContain('R$');
    expect(formatDateForForm('2026-04-08')).toBe('08/04/2026');
    expect(parseDateFromForm('08/04/2026')).toBe('2026-04-08');
    expect(parseDateFromForm('31/02/2026')).toBeNull();
  });

  it('sample seed records should have valid tracks and metadata', () => {
    expect(SAMPLE_RECORDS.length).toBeGreaterThanOrEqual(4);
    SAMPLE_RECORDS.forEach(record => {
      expect(record.id).toBeDefined();
      expect(record.title).toBeDefined();
      expect(record.artist).toBeDefined();
      expect(record.tracks.length).toBeGreaterThan(0);
      expect(record.mediaCondition).toBeDefined();
    });

    const loanedRecord = SAMPLE_RECORDS.find(r => r.isLoaned);
    expect(loanedRecord).toBeDefined();
    expect(loanedRecord?.currentLoan?.borrowerName).toBe('Alex Rivera');
  });

  it('creates an ID when secure-context UUID support is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    expect(generateUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('builds a Brazil-aware structured MusicBrainz query', () => {
    expect(buildReleaseQuery({ artist: 'Gal Costa', title: 'Índia', catalogNumber: '31C 062 42213' }, true))
      .toBe('catno:"31C 062 42213" AND artist:"Gal Costa" AND release:"Índia" AND country:BR');
  });
});
