// apps/api/src/queue/pdf-queue.types.ts

/**
 * Queue name used by producer/worker.
 * Can be overridden by env (e.g. PDF_QUEUE_NAME=pdf)
 */
export const PDF_QUEUE_NAME = process.env.PDF_QUEUE_NAME || 'pdf';

/**
 * Data the worker expects for each PDF job.
 * - `tenantId` is REQUIRED for idempotent storage (but we keep it optional in the type
 *    so callers can enrich it in a single place).
 * - `idemKey` and `scope` let the worker save a "scope -> fileKey" mapping for fast replay.
 * - `store`, `presign`, `email` are optional behaviors.
 */
export interface PdfJobData {
  type: 'invoice' | 'receipt' | 'statement';
  id: string;

  // multi-tenancy / idempotency
  tenantId?: string;
  idemKey?: string | null;
  scope?: string | null;

  // optional behaviors
  store?: boolean;
  presign?: boolean;
  email?: string | null;
}

/**
 * Result of a PDF job.
 * - `emailed` is optional (true when an email attempt was made).
 */
export interface PdfJobResult {
  ok: boolean;
  type: PdfJobData['type'];
  id: string;

  // success fields
  fileKey?: string;
  url?: string;
  emailed?: boolean;

  // error field (when ok=false)
  error?: string;
}
