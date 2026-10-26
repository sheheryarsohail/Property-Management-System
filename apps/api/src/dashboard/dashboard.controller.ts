import { Controller, Get, Req } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'

import { ApiKeyProtected } from '../auth/api-key.decorator'
import { DashboardService } from './dashboard.service'

@ApiKeyProtected()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getSummary(@Req() req: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local'
    return this.dashboardService.getSummary(tenantId, req.user)
  }
}

