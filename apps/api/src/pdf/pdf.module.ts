import { MiddlewareConsumer, Module, NestModule, RequestMethod, forwardRef  } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { PdfController } from './pdf.controller';
import { PdfStorage } from './pdf.storage';
import { StatementPdfService } from './services/statement-pdf.service';
import { InvoicePdfService } from './services/invoice-pdf.service';
import { ReceiptPdfService } from './services/receipt-pdf.service';
import { PrismaModule } from '../prisma/prisma.module'; // if Pdf services need Prisma
import { StatementsModule } from '../statements/statements.module';
import { IdemModule } from '../common/idem/idem.module'; // provides IdemService
import { IdemHeaderMiddleware } from '../common/idem/idem.middleware';


@Module({
  imports: [StorageModule, forwardRef(() => StatementsModule), PrismaModule,],
  controllers: [PdfController],
  providers: [
    PrismaService,
    PdfStorage,
    StatementPdfService,
    InvoicePdfService,
    ReceiptPdfService,
    IdemModule,
  ],
  exports: [
    PdfStorage,
    StatementPdfService,
    InvoicePdfService,
    ReceiptPdfService,
  ],
})
export class PdfModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply to only the three PDF endpoints
    consumer.apply(IdemHeaderMiddleware).forRoutes(
      { path: 'statements/property.pdf', method: RequestMethod.GET },
      { path: 'invoices/:id.pdf',        method: RequestMethod.GET },
      { path: 'receipts/:id.pdf',        method: RequestMethod.GET },
    );
    // Or: consumer.apply(IdemHeaderMiddleware).forRoutes(PdfController);
  }
}
