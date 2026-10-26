import { Injectable, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser, PDFOptions } from 'puppeteer';
import * as fs from 'fs';

// Narrow types for options to satisfy TS
type PaperFormat = NonNullable<PDFOptions['format']>;
type Margin = PDFOptions['margin'];

@Injectable()
export class PdfService implements OnModuleDestroy {
  private browserPromise: Promise<Browser> | null = null;
  private readonly maxConcurrent = 3;
  private activeCount = 0;
  private readonly waitingQueue: Array<() => void> = [];

  private async acquireSlot(): Promise<void> {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waitingQueue.push(() => {
        this.activeCount++;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.activeCount--;
    if (this.waitingQueue.length > 0) {
      const next = this.waitingQueue.shift();
      if (next) next();
    }
  }

  private getBrowser() {
    if (!this.browserPromise) {
      const execPath =
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        '/home/sheheryar-sohail/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome';

      this.browserPromise = puppeteer.launch({
        headless: true, // boolean for broad compatibility
        executablePath: fs.existsSync(execPath) ? execPath : undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    return this.browserPromise;
  }

  async htmlToPdfBuffer(
    html: string,
    options?: { format?: PaperFormat; margin?: Margin },
  ) {
    await this.acquireSlot();
    let page: any = null;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      const pdf = await page.pdf({
        printBackground: true,
        format: options?.format ?? 'A4',
        margin: options?.margin ?? { top: '16mm', right: '12mm', bottom: '16mm', left: '12mm' },
      });
      return Buffer.from(pdf);
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
      this.releaseSlot();
    }
  }

  async onModuleDestroy() {
    await this.close();
  }

  async close() {
    if (this.browserPromise) {
      const b = await this.browserPromise;
      await b.close();
      this.browserPromise = null;
    }
  }
}
