// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RequiresScopes } from '../auth/scopes.decorator';

@ApiTags('Health')
@ApiSecurity('x-api-key')
@Controller()
export class HealthController {
  // Guarded health (requires read:health)
  @Get('health')
  @RequiresScopes('read:health')
  @ApiOperation({ summary: 'Guarded health endpoint' })
  health() {
    return { ok: true };
  }
}
