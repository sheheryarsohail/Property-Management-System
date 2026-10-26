import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { PdcService } from './pdc.service';
import { CreatePdcDto, PdcBounceDto } from '../dto/pdc.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';

@ApiKeyProtected()
@Controller('pdc')
export class PdcController {
  constructor(private readonly svc: PdcService) {}

  @Get()
  list(
    @Req() req: FastifyRequest,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    if (customerId) return this.svc.listByCustomer(tenantId, customerId);
    return this.svc.list(tenantId, { status, search, from, to });
  }

  @Get('bounced')
  listBounced(@Req() req: FastifyRequest) { 
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.listBounced(tenantId); 
  }

  @Post()
  create(@Req() req: FastifyRequest, @Body() body: CreatePdcDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.create({ tenantId, ...body });
  }

  @Post(':id/deposit')
  deposit(@Req() req: FastifyRequest, @Param('id') id: string, @Body() body?: any) { 
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.deposit(tenantId, id); 
  }

  @Post(':id/clear')
  clear(@Req() req: FastifyRequest, @Param('id') id: string, @Body() body?: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.clear(tenantId, id, body || {});
  }

  @Post(':id/bounce')
  bounce(@Req() req: FastifyRequest, @Param('id') id: string, @Body() body?: PdcBounceDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.bounce(tenantId, id, body?.notes || body?.reason);
  }

  @Post(':id/return')
  returnCheque(@Req() req: FastifyRequest, @Param('id') id: string, @Body() body?: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.transition(tenantId, id, 'RETURNED' as any, body);
  }

  @Post(':id/cancel')
  cancelCheque(@Req() req: FastifyRequest, @Param('id') id: string, @Body() body?: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.transition(tenantId, id, 'CANCELLED' as any, body);
  }

  @Delete(':id')
  deleteCheque(@Req() req: FastifyRequest, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || (req as any).tenantId || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.delete(tenantId, id);
  }
}
