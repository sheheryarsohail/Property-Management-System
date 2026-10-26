// src/pdf/pdf-builder.ts
import PDFDocument from 'pdfkit';
import type * as PDFKit from 'pdfkit'; // ✅ type-only so PDFKit.PDFDocument resolves
import fs from 'node:fs';
import path from 'node:path';

export type BrandOptions = {
  orgName?: string;
  orgSubtitle?: string;
  orgAddress?: string;
  logoPath?: string; // absolute or relative to project root
};
// If needed:
export type PdfRenderInput = {
  buffer: Buffer;
  fileName: string;
  keyHint: string;
};

export type PdfPageOptions = {
  title: string;   // e.g., "Invoice", "Receipt", "Statement"
  idLabel: string; // e.g., "Invoice ID", "Receipt ID"
  idValue: string;
  dateLabel?: string;
  dateValue?: string;
};

export class PdfBuilder {
  private brand: BrandOptions;
  constructor(brand?: BrandOptions) {
    this.brand = brand ?? {};
  }
  

  /** Create a doc and return [doc, endToBuffer()] */
  createDoc() {
    const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true });
    const endToBuffer = () =>
      new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        doc.on('data', (c) => chunks.push(c as Buffer));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
      });
    return { doc, endToBuffer };
  }

  header(doc: PDFKit.PDFDocument, page: PdfPageOptions) {
    const topY = 36;

    // Logo (optional)
    const logo = this.brand.logoPath ? this.safeRead(this.brand.logoPath) : undefined;
    if (logo) {
      try { doc.image(logo, 48, topY - 6, { height: 36 }); } catch {}
    }

    // Org/Text
    doc.fontSize(14).text(this.brand.orgName ?? 'PMS', 48, topY, { continued: true });
    doc.fontSize(10).text(this.brand.orgSubtitle ? ` — ${this.brand.orgSubtitle}` : '');

    if (this.brand.orgAddress) {
      doc.fontSize(9).fillColor('#555').text(this.brand.orgAddress, 48, topY + 18);
      doc.fillColor('black');
    }

    // Title + meta (right aligned)
    const rightX = doc.page.width - 48;
    doc.fontSize(20).text(page.title, 48, topY + 40, { align: 'right', width: rightX - 48 });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`${page.idLabel}: ${page.idValue}`, { align: 'right' });
    if (page.dateLabel && page.dateValue) {
      doc.text(`${page.dateLabel}: ${page.dateValue}`, { align: 'right' });
    }

    // Divider
    doc.moveTo(48, topY + 88).lineTo(rightX, topY + 88).strokeColor('#ddd').stroke().strokeColor('black');
    doc.moveDown();
  }

  footer(doc: PDFKit.PDFDocument) {
    const { page } = doc;
    const bottomY = page.height - 36;
    const rightX = page.width - 48;

    // Divider
    doc.moveTo(48, bottomY - 16).lineTo(rightX, bottomY - 16).strokeColor('#eee').stroke().strokeColor('black');

    // Page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      const p = i - range.start + 1;
      doc.fontSize(9).fillColor('#666')
        .text(`Page ${p} of ${range.count}`, 48, bottomY - 12, { align: 'right' })
        .fillColor('black');
    }
  }

  /** Label/value block */
  kv(doc: PDFKit.PDFDocument, label: string, value: string) {
    doc.fontSize(10).fillColor('#666').text(label);
    doc.fillColor('black').fontSize(12).text(value).moveDown(0.2);
  }

  /** Simple table helper (auto page-breaks) */
    /** Simple table helper with auto page-breaks & header re-draw */
  table(
    doc: PDFKit.PDFDocument,
    headers: (string | number)[],
    rows: (string | number)[][],
    widths: number[],
    opts?: { x?: number; y?: number; rowGap?: number; headerGap?: number; zebra?: boolean }
  ) {
    const marginL = doc.page.margins?.left ?? 48;
    const marginR = doc.page.margins?.right ?? 48;
    const marginT = doc.page.margins?.top ?? 48;
    const marginB = doc.page.margins?.bottom ?? 48;

    const x0 = opts?.x ?? marginL;
    const rightX = doc.page.width - marginR;
    const rowGap = opts?.rowGap ?? 6;
    const headerGap = opts?.headerGap ?? 8;
    const zebra = opts?.zebra ?? false;

    let y = opts?.y ?? (doc.y ?? marginT);

    const drawHeader = () => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#111');
      let x = x0;
      headers.forEach((h, i) => {
        const w = widths[i] ?? 80;
        const align = i === headers.length - 1 ? 'right' : 'left';
        doc.text(String(h), x, y, { width: w, align });
        x += w;
      });
      y += headerGap;
      doc
        .moveTo(x0, y - Math.max(headerGap - 2, 2))
        .lineTo(rightX, y - Math.max(headerGap - 2, 2))
        .strokeColor('#ddd')
        .stroke()
        .strokeColor('black');
      doc.font('Helvetica').fillColor('black').fontSize(10);
    };

    const ensureSpace = (needed: number) => {
      const pageBottom = doc.page.height - marginB;
      if (y + needed > pageBottom) {
        doc.addPage();
        y = marginT;
        drawHeader();
      }
    };

    // initial header
    drawHeader();

    rows.forEach((cells, rowIdx) => {
      // compute row height based on wrapped text per column
      const heights = cells.map((cell, i) => {
        const w = widths[i] ?? 80;
        const txt = cell == null ? '' : String(cell);
        // ensure a minimum single-line height
        return Math.max(doc.heightOfString(txt, { width: w }), 12);
      });
      const rowH = Math.max(...heights) + rowGap;

      ensureSpace(rowH);

      // zebra background (optional)
      if (zebra && rowIdx % 2 === 1) {
        doc
          .save()
          .rect(x0, y - 2, rightX - x0, rowH)
          .fillOpacity(0.03)
          .fill('#000')
          .restore();
      }

      // draw row text
      let x = x0;
      cells.forEach((cell, i) => {
        const w = widths[i] ?? 80;
        const align = i === headers.length - 1 ? 'right' : 'left';
        const txt = cell == null ? '' : String(cell);
        doc.text(txt, x, y, { width: w, align });
        x += w;
      });

      y += rowH;

      // light separator
      doc
        .moveTo(x0, y - Math.ceil(rowGap / 2))
        .lineTo(rightX, y - Math.ceil(rowGap / 2))
        .strokeColor('#f2f2f2')
        .stroke()
        .strokeColor('black');
    });

    return y; // last y used
  }

  private safeRead(p: string) {
    try {
      const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
      return fs.existsSync(abs) ? abs : undefined;
    } catch {
      return undefined;
    }
  }
}
