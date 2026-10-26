// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';
import { ApiKeyProtected } from './auth/api-key.decorator';

@ApiKeyProtected()
@Controller()
export class AppController {
  @Public()
  @Get()
  home() {
    return {
      message: 'PMS API up',
      docs: '/health',
      queueHealth: '/jobs/_health', // or '/queue/_health' if you renamed it
    };
  }

  // @Public()
  // @Get('health')
  // health() {
  //   return {
  //     ok: true,
  //     now: new Date().toISOString(),
  //     uptimeSec: Math.round(process.uptime()),
  //   };
  // }
}
