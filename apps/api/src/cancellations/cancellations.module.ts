import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CancellationsController } from './cancellations.controller';
import { CancellationsService } from './cancellations.service';

@Module({
  imports: [PrismaModule],
  controllers: [CancellationsController],
  providers: [CancellationsService],
  exports: [CancellationsService],
})
export class CancellationsModule {}
