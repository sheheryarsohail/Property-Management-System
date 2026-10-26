// apps/api/src/debug/debug.controller.ts
import { Controller, Get } from '@nestjs/common';

function maskDbUrl(url?: string) {
  if (!url) return null;
  return url.replace(/(postgres(?:ql)?(?:\+.*)?:\/\/)([^@]+)@/i, '$1***@');
}

@Controller('debug')
export class DebugController {
  @Get('env')
  getEnv() {
    return {
      DATABASE_URL: maskDbUrl(process.env.DATABASE_URL),
      DIRECT_URL: maskDbUrl(process.env.DIRECT_URL),
      NODE_ENV: process.env.NODE_ENV ?? null,
      CWD: process.cwd(),
    };
  }
}
