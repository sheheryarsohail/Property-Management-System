import { Injectable, Logger } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';

export type ApiKeyRecord = {
  keyHash: string;          // lowercase hex sha256 of the raw key
  tenantId: string;
  userId: string;
  scopes: string[];         // e.g., ["read:health","read:storage"]
  active?: boolean;
};

export interface ApiPrincipal {
  keyId: string;
  tenantId: string;
  userId: string;
  scopes: string[]; // ← array, not Set
}

/** sha256(key) → lowercase hex */
function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** constant-time compare of two hex strings */
function safeEqHex(a: string, b: string): boolean {
  const ah = a.toLowerCase();
  const bh = b.toLowerCase();
  // quick reject if obviously not hex / wrong length
  if (ah.length !== bh.length || ah.length % 2 !== 0) return false;
  if (!/^[0-9a-f]+$/.test(ah) || !/^[0-9a-f]+$/.test(bh)) return false;

  const ab = Buffer.from(ah, 'hex');
  const bb = Buffer.from(bh, 'hex');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

@Injectable()
export class ApiKeyService {
  private readonly log = new Logger(ApiKeyService.name);
  private readonly records: ApiKeyRecord[] = [];
  private readonly devKey?: string;

  constructor() {
    // Load hashed keys from env JSON
    const raw = process.env.API_KEYS_JSON?.trim();
    if (raw) {
      try {
        const list = JSON.parse(raw) as ApiKeyRecord[];
        for (const r of list) {
          if (!r?.keyHash) continue;
          const keyHash = String(r.keyHash).toLowerCase().trim();
          // only accept proper 64-char hex hashes
          if (!/^[0-9a-f]{64}$/.test(keyHash)) {
            this.log.warn(`Skipping API key with invalid keyHash format: "${keyHash.slice(0, 8)}..."`);
            continue;
          }
          const rec: ApiKeyRecord = {
            keyHash,
            tenantId: String(r.tenantId || 't_default'),
            userId: String(r.userId || 'system'),
            scopes: Array.isArray(r.scopes) ? r.scopes.map(String) : [],
            active: r.active !== false,
          };
          this.records.push(rec);
        }
        this.log.log(`Loaded ${this.records.length} API key(s) from API_KEYS_JSON`);
      } catch (e: any) {
        this.log.error(`Failed to parse API_KEYS_JSON: ${e?.message || e}`);
      }
    }

    // Optional local dev raw key (NOT used in production)
    if (process.env.NODE_ENV !== 'production' && process.env.API_KEY) {
      this.devKey = String(process.env.API_KEY).trim();
      this.log.warn('Local dev API_KEY enabled (raw key fallback).');
    }
  }

  /**
   * Verify a presented token.
   * - Matches sha256(token) to any active record.keyHash
   * - In dev (non-prod) also accepts raw process.env.API_KEY
   */
  verify(token: string | undefined): ApiPrincipal | null {
  if (!token) return null;
  const presented = token.trim();
  if (!presented) return null;

  // Dev fallback
  if (this.devKey && presented === this.devKey) {
    return {
      keyId: 'dev',
      tenantId: 't_local',
      userId: 'dev',
      scopes: ['*', 'read:*', 'write:*'],   // ← array
    };
  }

  const h = sha256Hex(presented);
  for (const rec of this.records) {
    if (rec.active === false) continue;
    if (safeEqHex(rec.keyHash, h)) {
      return {
        keyId: h.slice(-12),
        tenantId: rec.tenantId,
        userId: rec.userId,
        scopes: rec.scopes || [],          // ← array
      };
    }
  }
  this.log.debug(`API key not recognized (sha256...${h.slice(-8)})`);
  return null;
}


  /** Backward-compatible async alias (some guards/services may call validate()). */
  async validate(token: string | undefined): Promise<ApiPrincipal | null> {
    return this.verify(token);
  }

  /**
   * (Optional) Helper if a guard wants to accept both:
   *  - x-api-key: <token>
   *  - authorization: ApiKey <token>
   */
  extractFromHeaders(headers?: Record<string, any>): string | undefined {
    if (!headers) return undefined;
    const h = Object.create(null) as Record<string, string>;
    for (const [k, v] of Object.entries(headers)) {
      h[String(k).toLowerCase()] = Array.isArray(v) ? String(v[0]) : String(v ?? '');
    }
    if (h['x-api-key']) return h['x-api-key'].trim();
    const auth = h['authorization'] || '';
    const m = /^apikey\s+(.+)$/i.exec(auth.trim());
    return m?.[1]?.trim();
  }

  /** Small helper to introspect in tests / health */
  getConfiguredKeyCount(): number {
    return this.records.length + (this.devKey ? 1 : 0);
  }
}
