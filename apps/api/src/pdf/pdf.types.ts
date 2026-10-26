// src/pdf/pdf.types.ts
// src/pdf/pdf.types.ts
export type PdfKind = 'invoice' | 'receipt' | 'statement';

export type PdfMeta = {
  id: string;
  key: string;
  url?: string;
  sha256?: string;
  size?: number;
  contentType?: string;
};

export type PdfJobData = {
  type: 'invoice' | 'receipt' | 'statement';
  id: string;
  tenantId?: string;
  store?: boolean;
  presign?: boolean;
  email?: string | null;
  idemKey?: string;
  scope?: string;
};
export type PdfJobResult = {
  ok: boolean;
  type: PdfJobData['type'];
  id: string;
  fileKey?: string;
  url?: string;
  emailed?: boolean;
  error?: string;
};
export const PDF_QUEUE_NAME = 'pdf';

export type PdfRenderInput = {
  id: any;
  tenantId: any;
  buffer: Buffer;
  fileName: string;
  keyHint: string;
};

