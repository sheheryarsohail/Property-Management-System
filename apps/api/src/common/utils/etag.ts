import { createHash } from 'node:crypto';
export function etagOf(buf: Buffer) {
  const h = createHash('sha256').update(buf).digest('hex');
  return `W/"${h.slice(0, 32)}"`; // Weak ETag is fine for PDFs
}
