import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { TransfersService } from './transfers.service';
import { CreateTransferDto, UpdateTransferDto, ApproveTransferDto, TransferStatus } from '../dto/transfers.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';

@ApiKeyProtected()
@ApiTags('transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  @ApiOperation({ summary: 'List ownership transfers' })
  @ApiResponse({ status: 200, description: 'Transfers retrieved' })
  async list(
    @Req() req: FastifyRequest,
    @Query('propertyId') propertyId?: string,
    @Query('status') status?: TransferStatus,
    @Query('search') search?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.transfersService.list(tenantId, { propertyId, status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transfer details' })
  @ApiResponse({ status: 200, description: 'Transfer retrieved' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async get(@Req() req: FastifyRequest, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.transfersService.get(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ownership transfer' })
  @ApiResponse({ status: 201, description: 'Transfer created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Property or customer not found' })
  async create(@Req() req: FastifyRequest, @Body() dto: CreateTransferDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.transfersService.create(tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update transfer (DRAFT only)' })
  @ApiResponse({ status: 200, description: 'Transfer updated' })
  @ApiResponse({ status: 400, description: 'Cannot update non-DRAFT transfer' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async update(@Req() req: FastifyRequest, @Param('id') id: string, @Body() dto: UpdateTransferDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.transfersService.update(tenantId, id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit transfer for approval' })
  @ApiResponse({ status: 200, description: 'Transfer submitted' })
  @ApiResponse({ status: 400, description: 'Only DRAFT transfers can be submitted' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async submit(@Req() req: FastifyRequest, @Param('id') id: string) {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
      return await this.transfersService.submit(tenantId, id);
    } catch (e) {
      console.error('Submit error:', e);
      throw e;
    }
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve transfer and execute ownership change' })
  @ApiResponse({ status: 200, description: 'Transfer approved' })
  @ApiResponse({ status: 400, description: 'Cannot approve or has outstanding dues' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async approve(@Req() req: FastifyRequest, @Param('id') id: string, @Body() dto?: ApproveTransferDto) {
    try {
      const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
      const userId = (req.headers['x-user-id'] as string) || 'system';
      
      const safeDto = dto || {} as ApproveTransferDto;
      
      return await this.transfersService.approve(tenantId, id, {
        adminOverride: safeDto.adminOverride,
        adminOverrideReason: safeDto.adminOverrideReason,
        adminOverrideBy: safeDto.adminOverride ? userId : undefined,
        transferFee: safeDto.transferFee,
        paymentMethod: safeDto.paymentMethod,
        bankName: safeDto.bankName,
        chequeNumber: safeDto.chequeNumber,
      });
    } catch (e) {
      console.error('Approve error:', e);
      throw e;
    }
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject transfer' })
  @ApiResponse({ status: 200, description: 'Transfer rejected' })
  @ApiResponse({ status: 400, description: 'Only SUBMITTED transfers can be rejected' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async reject(@Req() req: FastifyRequest, @Param('id') id: string, @Body() body?: { reason?: string }) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.transfersService.reject(tenantId, id, body?.reason);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transfer (DRAFT or REJECTED only)' })
  @ApiResponse({ status: 200, description: 'Transfer deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete non-DRAFT/REJECTED transfer' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async delete(@Req() req: FastifyRequest, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.transfersService.delete(tenantId, id);
  }
}
