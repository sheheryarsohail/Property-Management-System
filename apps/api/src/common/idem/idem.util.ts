import { IdemLike } from './idem.types';

// Normalize whatever we got into a header string (or undefined)
export function idemHeaderValue(idem: IdemLike): string | undefined {
  if (!idem) return undefined;
  if (typeof idem === 'string') return idem;
  return idem.key ?? undefined;
}
