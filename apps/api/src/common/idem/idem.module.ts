import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { IdemService } from './idem.service';

@Global() // <-- make it global
@Module({
  imports: [PrismaModule],
  providers: [IdemService],
  exports: [IdemService], // <-- important
})
export class IdemModule {}
