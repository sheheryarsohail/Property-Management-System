import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OwnershipsService } from './ownerships.service';
import { CreateOwnershipDto, TransferOwnershipDto } from '../dto/ownerships.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';


@ApiKeyProtected()
@Controller('ownerships')
export class OwnershipsController {
  constructor(private readonly svc: OwnershipsService) {}

  @Get()
  list(@Query('propertyId') propertyId?: string, @Query('customerId') customerId?: string) {
    if (propertyId) return this.svc.listByProperty(propertyId);
    if (customerId) return this.svc.listByCustomer(customerId);
    return [];
  }

  @Post()
  createActive(@Body() body: CreateOwnershipDto) {
    return this.svc.createActive(body);
  }
}
