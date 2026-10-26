import { Worker, Job } from 'bullmq';
// import removed to avoid compilation error
type PdfService = any;

export function startReceiptPdfWorker(connection: any, pdf: PdfService) {
  const worker = new Worker<unknown>('pdf', async (job: Job) => {
    if (job.name !== 'receipt.pdf') return;
    const { tenantId, receiptId, idemKey } = job.data as any;
    await pdf.generateAndStoreReceiptPdf({ tenantId, receiptId, idemKey });
  }, { connection });
  return worker;
}
