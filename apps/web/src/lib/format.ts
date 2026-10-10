import { APP_CURRENCY, APP_LOCALE } from './locale';

const EMPTY = '-';

function currencyFormat(currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat(APP_LOCALE, { style: 'currency', currency });
}

// ISO 4217 minor units: 2 for INR, 0 for JPY, 3 for KWD.
function minorDigits(currency: string): number {
  return currencyFormat(currency).resolvedOptions().maximumFractionDigits ?? 2;
}

export function formatMoney(
  minor: number | null | undefined,
  currency: string = APP_CURRENCY,
): string {
  if (minor === null || minor === undefined) return EMPTY;
  return currencyFormat(currency).format(minor / 10 ** minorDigits(currency));
}

// Shifting the exponent in the string form avoids float error that a
// multiplication keeps: 1.005 * 100 is 100.49999999999999. Values already in
// exponent form (1e-7) do not survive the string trick and multiply instead.
export function toMinorUnits(
  major: number,
  currency: string = APP_CURRENCY,
): number {
  const digits = minorDigits(currency);
  const shifted = Number(`${major}e${digits}`);
  return roundHalfAwayFromZero(
    Number.isNaN(shifted) ? major * 10 ** digits : shifted,
  );
}

// Math.round sends halves up, so -100.5 would become -100 while 100.5
// becomes 101. Money rounds the magnitude, then keeps the sign.
function roundHalfAwayFromZero(value: number): number {
  const rounded = Math.round(Math.abs(value));
  return value < 0 && rounded !== 0 ? -rounded : rounded;
}

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined) return EMPTY;
  return new Intl.NumberFormat(APP_LOCALE, options).format(value);
}

export function getInitials(name: string | null | undefined): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const first = words[0];
  if (!first) return '';
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  return [first, last]
    .map((word) => (word ? Array.from(word)[0] : ''))
    .join('')
    .toLocaleUpperCase(APP_LOCALE);
}
