import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfStorage } from '../pdf.storage';
import { PdfMeta, PdfRenderInput } from '../pdf.types';
import { StatementPdfBuilder } from '../builders/statement.builder';

@Injectable()
export class StatementPdfService {
  private builder = new StatementPdfBuilder();

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfStorage: PdfStorage,
  ) {}

  async generateAndStore(input: PdfRenderInput): Promise<PdfMeta> {
    // 1) Load data with tenant isolation
    const stmt = await this.prisma.statement.findFirst({
  where: { id: input.id, tenantId: input.tenantId },
});

    if (!stmt) throw new NotFoundException('Statement not found');

    // 2) Optionally massage into a DTO for builder; for demo we pass input only
    const buffer = await this.builder.renderToBuffer(input);

    // 3) Store idempotently
    return this.pdfStorage.store({
      tenantId: input.tenantId,
      kind: 'statement',
      id: input.id,
      buffer,
      keyHint: `statements/${input.id}.pdf`,
      version: 'v1',
    });
  }
}
