// apps/api/src/common/utils/tenant.ts
import type { FastifyRequest } from 'fastify';

export type TenantId = string;

/**
 * Resolve the tenant id for the current request.
 * Priority:
 *   1) X-Tenant-Id header (explicit override)
 *   2) req.auth.tenantId (set by your ApiKeyGuard / auth layer)
 *   3) DEFAULT_TENANT_ID env or 't_local'
 */
export function getTenantId(req: FastifyRequest): TenantId {
  const hdr = (req.headers['x-tenant-id'] as string | undefined)?.trim();
  if (hdr) return hdr;

  const fromAuth = (req as any)?.auth?.tenantId;
  if (typeof fromAuth === 'string' && fromAuth.trim().length > 0) {
    return fromAuth.trim();
  }

  return (process.env.DEFAULT_TENANT_ID || 't_local') as TenantId;
}
