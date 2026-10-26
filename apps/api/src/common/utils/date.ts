export function formatDate(value: unknown, locale = 'en-US') {
  try {
    const d = value instanceof Date ? value : new Date(String(value ?? ''));
    if (isNaN(d.getTime())) return String(value ?? '');
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: '2-digit' });
  } catch {
    return String(value ?? '');
  }
}
