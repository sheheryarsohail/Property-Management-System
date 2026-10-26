import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

@Injectable()
export class PdfRenderer {
  async render(receipt: any): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    return new Promise<Buffer>((resolve) => {
      doc.fontSize(18).text(`Receipt #${receipt.code}`, { align: 'right' });
      doc.moveDown();
      doc.fontSize(12).text(`Date: ${new Date(receipt.date).toDateString()}`);
      doc.text(`Tenant: ${receipt.tenantName}`);
      doc.text(`Property: ${receipt.propertyName}`);
      doc.moveDown();
      doc.text(`Amount Paid: ${receipt.amountFormatted}`);
      doc.text(`Method: ${receipt.method}`);
      doc.moveDown();
      doc.text(`Notes: ${receipt.notes || '-'}`);
      doc.end();
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
