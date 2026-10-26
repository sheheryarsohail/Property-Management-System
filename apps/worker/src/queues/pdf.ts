export const PDF_QUEUE = 'pdf.queue' as const;
export const PDF_JOB_GENERATE = 'pdf.generate' as const;

export type GeneratePdfJob = {
  tenantId: string;          // multi-tenant isolation
  docType: 'invoice' | 'receipt' | 'statement';
  payload: {
    // whatever your existing API already sends to the PDF generator
    invoiceId?: string;
    receiptId?: string;
    statementId?: string;
    // optional rendering flags
    force?: boolean;
  };
  correlationId?: string;    // for tracing
  requestedBy?: string;      // user id/email
};
