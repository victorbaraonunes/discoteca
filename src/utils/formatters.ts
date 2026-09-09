import { GoldmineCondition, VinylFormat } from '../types/vinyl';
import { Language } from '../i18n/translations';

export function formatDateTime(isoString?: string, lang: Language = 'pt-BR'): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    const locale = lang === 'pt-BR' ? 'pt-BR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString?: string, lang: Language = 'pt-BR'): string {
  if (!isoString) return '—';
  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(isoString)
      ? new Date(`${isoString}T12:00:00`)
      : new Date(isoString);
    const locale = lang === 'pt-BR' ? 'pt-BR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateForForm(isoString?: string): string {
  if (!isoString) return '';
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : isoString;
}

export function parseDateFromForm(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
    return null;
  }
  return `${year}-${month}-${day}`;
}

export function formatCurrency(amount?: number, currency?: string, lang: Language = 'pt-BR'): string {
  if (amount === undefined || amount === null) return '—';

  const currencyCode = currency === '$' ? 'USD' : currency === 'R$' ? 'BRL' : currency || 'BRL';
  const locale = lang === 'pt-BR' ? 'pt-BR' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currencyCode }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function isLoanOverdue(expectedReturnIso?: string): boolean {
  if (!expectedReturnIso) return false;
  try {
    return new Date(expectedReturnIso).getTime() < Date.now();
  } catch {
    return false;
  }
}

export function getConditionBadge(condition: GoldmineCondition | null | undefined, lang: Language = 'pt-BR'): { label: string; full: string; color: string } {
  const isPt = lang === 'pt-BR';

  switch (condition) {
    case 'M':
      return {
        label: 'M',
        full: isPt ? 'Novo / Lacrado' : 'Mint',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    case 'NM':
      return {
        label: 'NM',
        full: isPt ? 'Quase Perfeito' : 'Near Mint',
        color: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      };
    case 'VG+':
      return {
        label: 'VG+',
        full: isPt ? 'Muito Bom Plus' : 'Very Good Plus',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      };
    case 'VG':
      return {
        label: 'VG',
        full: isPt ? 'Muito Bom' : 'Very Good',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    case 'G+':
      return {
        label: 'G+',
        full: isPt ? 'Bom Plus' : 'Good Plus',
        color: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      };
    case 'G':
      return {
        label: 'G',
        full: isPt ? 'Bom' : 'Good',
        color: 'bg-amber-700/20 text-amber-400 border-amber-700/40',
      };
    case 'F':
      return {
        label: 'F',
        full: isPt ? 'Razoável' : 'Fair',
        color: 'bg-rose-600/20 text-rose-300 border-rose-600/40',
      };
    case 'P':
      return {
        label: 'P',
        full: isPt ? 'Ruim' : 'Poor',
        color: 'bg-red-900/30 text-red-400 border-red-800/40',
      };
    default:
      return {
        label: '—',
        full: isPt ? 'Não especificado' : 'Not specified',
        color: 'bg-zinc-700/30 text-zinc-300 border-zinc-600',
      };
  }
}

export function getFormatIcon(format: VinylFormat): string {
  switch (format) {
    case '7" Single':
      return '7"';
    case '10" EP':
      return '10"';
    case '12" LP':
      return '12"';
    case 'Gatefold':
      return 'GF';
    case '2xLP':
      return '2LP';
    case 'Box Set':
      return 'BOX';
    default:
      return 'LP';
  }
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
