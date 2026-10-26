export const PDF_QUEUE_NAME = 'pdf.queue' as const;

// Job "name" (not the queue) – producer uses this constant
export const PDF_JOB_NAME = 'pdf.generate' as const;

export type PdfJobKind = 'invoice' | 'receipt' | 'statement';

export type PdfJobData = {
  type: PdfJobKind;
  id: string;
  store: boolean;
  presign: boolean;
  email: string | null;
  // idempotency hints (passed through from API producer)
  idemKey?: string;
  scope?: string;
};

export type PdfJobResult = {
  ok: true;
  url: string;     // presigned (if requested) or public URL
  key: string;     // object key in S3/MinIO
  size: number;    // bytes
  docType: PdfJobKind;
  entityId: string;
  processedAt: string; // ISO
};
