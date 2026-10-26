import { Controller, Get, Param } from '@nestjs/common';
import { PortalService } from './portal.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('portal')
export class PortalController {
  constructor(private readonly svc: PortalService) {}

  @Get(':accessId')
  getPortalData(@Param('accessId') accessId: string) {
    return this.svc.getCustomerPortalData(accessId);
  }
}
