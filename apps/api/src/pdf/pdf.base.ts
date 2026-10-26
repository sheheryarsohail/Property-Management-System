import PDFDocument from 'pdfkit';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const fontsDir = join(__dirname, 'templates', 'fonts');

export async function newDoc() {
  const doc = new PDFDocument({ autoFirstPage: false });
  // add a page with margins
  doc.addPage({ margins: { top: 48, right: 48, bottom: 64, left: 48 }});
  // register fonts if present
  const interReg = join(fontsDir, 'Inter-Regular.ttf');
  if (existsSync(interReg)) doc.registerFont('Inter', interReg);
  const interBold = join(fontsDir, 'Inter-Bold.ttf');
  if (existsSync(interBold)) doc.registerFont('Inter-Bold', interBold);
  return doc;
}

export async function endToBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export function sha256(buf: Buffer) {
  return createHash('sha256').update(buf).digest('hex');
}
