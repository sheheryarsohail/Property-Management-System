import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiKeyProtected } from '../auth/api-key.decorator';
import { CancellationsService } from './cancellations.service';

@ApiKeyProtected()
@Controller('cancellations')
export class CancellationsController {
  constructor(private readonly cancellationsService: CancellationsService) {}

  @Get('defaulters')
  async listPlotsWithDues(
    @Req() req: FastifyRequest,
    @Query('filter') filter?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.cancellationsService.listPlotsWithDues(tenantId, {
      filter,
      q,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get('search-active')
  async searchActiveProperties(
    @Req() req: FastifyRequest,
    @Query('q') q?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.cancellationsService.searchActiveProperties(tenantId, q);
  }

  @Get('preview/:propertyId')
  async previewCancellation(
    @Req() req: FastifyRequest,
    @Param('propertyId') propertyId: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.cancellationsService.previewCancellation(tenantId, propertyId);
  }

  @Post('execute')
  async executeCancellation(
    @Req() req: FastifyRequest,
    @Body() body: any,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    const user = (req as any).user;
    return this.cancellationsService.executeCancellation(tenantId, body, user);
  }

  @Get('history')
  async listHistory(
    @Req() req: FastifyRequest,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.cancellationsService.listHistory(tenantId, {
      q,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get(':id')
  async getCancellation(
    @Req() req: FastifyRequest,
    @Param('id') id: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.cancellationsService.getCancellation(tenantId, id);
  }
}
