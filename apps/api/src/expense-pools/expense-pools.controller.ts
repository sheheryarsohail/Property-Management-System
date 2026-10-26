import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ExpensePoolsService } from './expense-pools.service';
import { AllocatePoolDto, AttachExpensesDto, CreateExpensePoolDto, GenerateRecoveryDto } from '../dto/expense-pools.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';

@ApiKeyProtected()
@Controller('expense-pools')
export class ExpensePoolsController {
  constructor(private readonly svc: ExpensePoolsService) {}

  @Post()
  create(@Body() body: CreateExpensePoolDto) {
    return this.svc.create(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post(':id/attach-expenses')
  attach(@Param('id') id: string, @Body() body: AttachExpensesDto) {
    return this.svc.attachExpenses(id, body);
  }

  @Post(':id/allocate')
  allocate(@Param('id') id: string, @Body() body: AllocatePoolDto) {
    return this.svc.allocate(id, body);
  }

  @Post(':id/generate-recovery')
  recover(@Param('id') id: string, @Body() body: GenerateRecoveryDto) {
    return this.svc.generateRecovery(id, body);
  }
}
