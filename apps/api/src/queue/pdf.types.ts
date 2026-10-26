export type PdfJobType = 'invoice' | 'receipt' | 'statement';

export interface PdfJobData {
  type: PdfJobType;
  id: string;
  store?: boolean;
  presign?: boolean;
  email?: string | null;
  idemKey?: string;          // <-- new (from controller header)
  scope?: string; 
}

export interface PdfJobResult {
  ok: boolean;
  type: PdfJobType;
  id: string;
  key?: string;
  url?: string;
  error?: string;
  fileKey?: string;          // <-- new (S3 key or storage key)
}

export const PDF_QUEUE_NAME = 'pdf';
