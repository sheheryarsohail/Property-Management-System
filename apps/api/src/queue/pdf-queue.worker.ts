// apps/api/src/queue/pdf-worker.ts
import { Injectable, Logger } from '@nestjs/common';
import { PdfJobData, PdfJobResult } from './pdf-queue.types';
import { ReceiptsService } from '../receipts/receipts.service';
import { StatementsService } from '../statements/statements.service';
import { InvoicesService } from '../invoices/invoices.service';
import { StorageService } from '../storage/storage.service';
import { IdemService } from '../common/idem/idem.service';

@Injectable()
export class PdfQueueWorker {
  private readonly logger = new Logger(PdfQueueWorker.name);

  constructor(
    private readonly receipts: ReceiptsService,
    private readonly statements: StatementsService,
    private readonly invoices: InvoicesService,
    private readonly storage: StorageService,
    private readonly idem: IdemService,
  ) {}

  /**
   * Handles a PDF job by generating a PDF buffer,
   * storing it via StorageService.putPdfIdempotent(...),
   * optionally saving a header-based idempotency mapping (scope + idemKey),
   * and optionally returning a presigned URL.
   *
   * Contract:
   *  - Returns { ok: true, type, id, fileKey, url?, emailed? } on success
   *  - Returns { ok: false, type, id, error } on failure
   */
  async handle(data: PdfJobData): Promise<PdfJobResult> {
    let { type, id, tenantId, idemKey, scope, presign, email } = data;

    const started = Date.now();
    try {
      // Default tenant in case upstream forgot to populate
      tenantId = tenantId || process.env.DEFAULT_TENANT_ID || 't_local';

      // 1) Generate the PDF buffer
      const pdf = await this.renderPdf(type, id);

      // 2) Store idempotently; keyHint yields human-friendly suffix
      const keyHint = this.keyHintFor(type, id);
      const put = await this.storage.putPdfIdempotent(pdf, {
        tenantId,
        idempotencyKey: idemKey || undefined,
        keyHint,
      });

      // 3) Optional presign
      let url: string | undefined;
      if (presign) {
        try {
          url = await this.storage.presignGet(put.key, 300);
        } catch {
          // ignore presign failure; caller still has key
        }
      }

      // 4) Optional email
      if (email) {
        try {
          await this.emailPdf(type, id, email, pdf);
        } catch {
          // do not fail job on email errors
        }
      }

      // 5) Optional: save an extra idem mapping (scope -> fileKey) for fast “replay by scope”
      if (scope && idemKey) {
        try {
          // IdemService.save expects an IdemResponse shape, not a raw string.
          // Also pass tenantId if your service records it.
          await this.idem.save(idemKey, scope, { key: put.key }, tenantId);
          this.logger.log(`Idempotency saved: [${scope}] <- ${idemKey} -> ${put.key}`);
        } catch (e: any) {
          this.logger.warn(`Idem save failed (${scope}/${idemKey}): ${e?.message ?? e}`);
        }
      }

      const took = Date.now() - started;
      this.logger.log(`PDF job OK — ${type}:${id} → ${put.key} (${took}ms)`);
      return { ok: true, type, id, fileKey: put.key, url, emailed: !!email };
    } catch (err: any) {
      const took = Date.now() - started;
      const msg = err?.message ?? String(err);
      this.logger.error(`PDF job FAIL — ${type}:${id} (${took}ms): ${msg}`);
      return { ok: false, type, id, error: msg };
    }
  }

  /** Render a PDF buffer for the given type/id. */
  private async renderPdf(type: PdfJobData['type'], id: string): Promise<Buffer> {
    switch (type) {
      case 'invoice': {
        const buf = await this.invoices.generateInvoicePdf(id);
        this.assertBuffer(buf, type, id);
        return buf;
      }
      case 'receipt': {
        const buf = await this.receipts.generateReceiptPdf(id);
        this.assertBuffer(buf, type, id);
        return buf;
      }
      case 'statement': {
        const buf = await this.statements.generateStatementPdf(id);
        this.assertBuffer(buf, type, id);
        return buf;
      }
      default: {
        const neverType: never = type as never;
        throw new Error(`Unknown PDF type: ${String(neverType)}`);
      }
    }
  }

  private keyHintFor(type: PdfJobData['type'], id: string): string {
    switch (type) {
      case 'invoice':   return `invoices_${id}.pdf`;
      case 'receipt':   return `receipts_${id}.pdf`;
      case 'statement': return `statements_${id}.pdf`;
      default:          return `${type}_${id}.pdf`;
    }
  }

  private assertBuffer(buf: unknown, type: string, id: string): asserts buf is Buffer {
    if (!buf || !(buf instanceof Buffer)) {
      throw new Error(`Expected Buffer from ${type}.generate*Pdf for id=${id}`);
    }
  }

  private async emailPdf(type: PdfJobData['type'], id: string, to: string, pdf: Buffer) {
    const filename = `${type}-${id}.pdf`;
    const subject  = `${this.titleFor(type)} ${id}`;
    const body     = `Please find attached ${this.titleFor(type)} ${id}.`;
    // Assuming you actually inject a MailerService; adjust if needed.
    if (typeof (this as any).mailer?.sendPdf === 'function') {
      await (this as any).mailer.sendPdf(to, subject, body, filename, pdf);
    }
  }

  private titleFor(type: PdfJobData['type']): string {
    switch (type) {
      case 'invoice':   return 'Invoice';
      case 'receipt':   return 'Receipt';
      case 'statement': return 'Statement';
      default:          return 'Document';
    }
  }
}
