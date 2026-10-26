import { Module } from '@nestjs/common';
import { ExpensePoolsService } from './expense-pools.service';
import { ExpensePoolsController } from './expense-pools.controller';

@Module({
  providers: [ExpensePoolsService],
  controllers: [ExpensePoolsController]
})
export class ExpensePoolsModule {}
