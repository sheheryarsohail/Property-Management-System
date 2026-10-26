import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from '../dto/properties.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiKeyProtected()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly svc: PropertiesService) {}

  @Get()
  list(
    @TenantId() tenantId: string,
    @Query('customerId') customerId?: string,
    @Query('assigned') assigned?: string,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    return this.svc.list(tenantId, {
      customerId,
      assigned: assigned === 'true',
      search,
      status,
    });
  }

  @Get(':id')
  get(@TenantId() tenantId: string, @Param('id') id: string) { return this.svc.get(tenantId, id); }

  @Post()
  create(@TenantId() tenantId: string, @Body() body: CreatePropertyDto) {
    return this.svc.create(tenantId, body);
  }

  @Put(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.svc.update(tenantId, id, body);
  }

  @Put(':id/correct-customer')
  correctCustomer(@TenantId() tenantId: string, @Param('id') id: string, @Body() body: { newCustomerId: string }) {
    return this.svc.correctCustomer(tenantId, id, body.newCustomerId);
  }
}
