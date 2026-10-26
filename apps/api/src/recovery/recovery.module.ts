import { Module } from '@nestjs/common';
import { RecoveryController } from './recovery.controller';
import { RecoveryService } from './recovery.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecoveryController],
  providers: [RecoveryService],
  exports: [RecoveryService],
})
export class RecoveryModule {}
