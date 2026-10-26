import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PortalService } from './portal.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller('portal')
export class PortalController {
  constructor(private readonly svc: PortalService) {}

  @Post('login')
  login(@Body() body: { identifier: string; pin?: string; password?: string }) {
    return this.svc.customerLogin(body);
  }

  @Get(':accessId')
  getPortalData(@Param('accessId') accessId: string) {
    return this.svc.getCustomerPortalData(accessId);
  }
}
