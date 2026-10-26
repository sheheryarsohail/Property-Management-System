import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto/customers.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiKeyProtected()
@Controller('customers')
export class CustomersController {
  constructor(private readonly svc: CustomersService) {}

  @Get()
  list(@TenantId() tenantId: string, @Query('search') search?: string) {
    return this.svc.list(tenantId, { q: search || undefined });
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.svc.get(id); }

  @Post()
  create(@TenantId() tenantId: string, @Body() body: CreateCustomerDto) {
    return this.svc.create(tenantId, body);
  }

  @Post(':id/portal-access')
  updatePortalStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.svc.updatePortalStatus(id, body.isActive);
  }

  @Post(':id/portal-credentials')
  updatePortalCredentials(@Param('id') id: string, @Body() body: { password?: string; pin?: string }) {
    return this.svc.updatePortalCredentials(id, body.password || body.pin);
  }

  @Put(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: UpdateCustomerDto) {
    return this.svc.update(tenantId, id, body);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.svc.remove(tenantId, id);
  }

}
