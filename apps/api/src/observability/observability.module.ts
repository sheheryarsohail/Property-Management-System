import { Module } from '@nestjs/common';
import { ObservabilityController } from './observability.controller';
import { JobsModule } from '../queue/jobs.module';

@Module({
  imports: [JobsModule], // so controller can inject JobsService
  controllers: [ObservabilityController],
})
export class ObservabilityModule {}
