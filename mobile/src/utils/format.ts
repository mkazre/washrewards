/** Format a rand amount: R59, R189, R12.50. Coerces string decimals ("59.00"). */
export function money(n: number | string | null | undefined): string {
  const num = typeof n === 'number' ? n : Number(n);
  if (n === null || n === undefined || !isFinite(num)) return 'R0';
  return 'R' + (Number.isInteger(num) ? String(num) : num.toFixed(2));
}

/** Coerce an API numeric field that may arrive as a string. */
export function num(v: number | string | null | undefined): number {
  const n = typeof v === 'number' ? v : Number(v);
  return isFinite(n) ? n : 0;
}

export function initials(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

/** "14:00" style time from an ISO timestamp */
export function timeOf(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "12 Jun" style short date */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

/** Relative-ish label for reviews / activity */
export function relativeDay(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return shortDate(iso);
}

/**
 * Build an ISO datetime for a "HH:mm" slot today; if that time has already
 * passed, roll to tomorrow so the backend's `after:now` rule is satisfied.
 */
export function slotToISO(label: string): string {
  const [h, m] = label.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= Date.now() + 60000) d.setDate(d.getDate() + 1);
  return d.toISOString();
}
