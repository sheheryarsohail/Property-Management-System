// src/common/utils/money.ts
export function formatMoney(value: unknown, currency = 'USD', locale = 'en-US') {
  let n: number;
  try {
    if (value && typeof value === 'object' && 'toNumber' in (value as any)) {
      n = (value as any).toNumber();
    } else {
      n = Number(value);
    }
  } catch { n = Number(value); }
  if (!Number.isFinite(n)) return String(value ?? '');
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
}
