import { Module } from '@nestjs/common';
import { StatementsController } from './statements.controller';
import { StatementsService } from './statements.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { MailerModule } from '../mailer/mailer.module';
import { PdfQueueModule } from '../queue/pdf-queue.module';
import { StatementsPropertyController } from './statements.property.controller';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    MailerModule,
    PdfQueueModule, // <-- and this
  ],
  controllers: [StatementsController, StatementsPropertyController],
  providers: [StatementsService],
  exports: [StatementsService],
})
export class StatementsModule {}
