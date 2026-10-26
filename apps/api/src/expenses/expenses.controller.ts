import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, ListExpensesQuery } from '../dto/expenses.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';

@ApiKeyProtected()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly svc: ExpensesService) {}

  @Post()
  create(@Req() req: FastifyRequest, @Body() body: CreateExpenseDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.create(tenantId, body);
  }

  @Get()
  list(@Req() req: FastifyRequest, @Query() q: ListExpensesQuery) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.list(tenantId, q);
  }

  @Get(':id')
  findOne(@Req() req: FastifyRequest, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.findOne(tenantId, id);
  }
}
