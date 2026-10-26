// src/common/idem/idem.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type IdemResponse =
  | { key: string } // minimal response (e.g., storage key)
  | Record<string, any>; // or full structured payload (e.g., StoragePutResult)

@Injectable()
export class IdemService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Return existing mapping for (key, scope), if any.
   * Pure read — no writes, no side effects.
   */
  async get(idemKey: string, scope: string) {
    if (!idemKey || !scope) return null;
    return this.prisma.idempotencyKey.findUnique({
      where: { key_scope: { key: idemKey, scope } },
    });
  }

  /**
   * "Guard" path most controllers call first:
   * If there's a stored response for (key, scope), return it for replay.
   * Do not create anything here.
   */
  async guard(idemKey: string, scope: string, tenantId: any) {
    return this.get(idemKey, scope);
  }

  /**
   * Save/overwrite mapping for (key, scope) → response.
   * Use when you have a definitive result to persist for replays.
   */
  async save(idemKey: string, scope: string, response: IdemResponse, tenantId?: string) {
    if (!idemKey) throw new Error('IdemService.save: idemKey required');
    if (!scope) throw new Error('IdemService.save: scope required');

    // If you always know tenantId, pass it; if not, we’ll default to scope for now.
    const tenant = tenantId ?? scope;

    return this.prisma.idempotencyKey.upsert({
      where: { key_scope: { key: idemKey, scope } },
      create: {
        key: idemKey,
        scope,
        response,
        tenantId: tenant,
      },
      update: {
        response,
        tenantId: tenant,
      },
    });
  }

  /**
   * Best-effort “first-write-wins” helper for dedupe scenarios.
   * If a row exists we DO NOT overwrite its response.
   */
  async saveIfAbsent(idemKey: string, scope: string, response: IdemResponse, tenantId?: string) {
    if (!idemKey) throw new Error('IdemService.saveIfAbsent: idemKey required');
    if (!scope) throw new Error('IdemService.saveIfAbsent: scope required');

    const tenant = tenantId ?? scope;

    return this.prisma.idempotencyKey.upsert({
      where: { key_scope: { key: idemKey, scope } },
      create: {
        key: idemKey,
        scope,
        response,
        tenantId: tenant,
      },
      // keep the original response; only ensure tenant is set for bookkeeping
      update: {
        tenantId: tenant,
      },
    });
  }

  /**
   * Optional: explicitly clear a mapping (not usually needed in prod).
   */
  async forget(idemKey: string, scope: string) {
    try {
      await this.prisma.idempotencyKey.delete({
        where: { key_scope: { key: idemKey, scope } },
      });
      return { ok: true };
    } catch {
      // ignore missing
      return { ok: true };
    }
  }
}
