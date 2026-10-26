import { Global, Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { StorageCleanupService } from './storage.cleanup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [StorageController],
  providers: [StorageService, StorageCleanupService],
  exports: [StorageService, StorageCleanupService],
})
export class StorageModule {}
