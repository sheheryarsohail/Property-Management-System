import { Controller, Get, Post, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { RecoveryService } from './recovery.service';
import { AllocateExpensePoolDto, GenerateRecoveryInvoicesDto } from '../dto/recovery.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';

@ApiKeyProtected()
@ApiTags('recovery')
@Controller('recovery')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Post('allocate')
  @ApiOperation({ summary: 'Allocate expense pool to properties' })
  @ApiResponse({ status: 201, description: 'Expenses allocated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or no expenses to allocate' })
  @ApiResponse({ status: 404, description: 'Expense pool not found' })
  async allocate(@Req() req: FastifyRequest, @Body() dto: AllocateExpensePoolDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.recoveryService.allocateExpensePool(tenantId, dto.poolId, dto.method, {
      propertyIds: dto.propertyIds,
      fixedAllocations: dto.fixedAllocations,
      chargeTitle: dto.chargeTitle,
      chargeDate: dto.chargeDate ? new Date(dto.chargeDate) : undefined,
    });
  }

  @Post('generate-invoices')
  @ApiOperation({ summary: 'Generate invoices from recovery charges' })
  @ApiResponse({ status: 201, description: 'Invoices generated successfully' })
  @ApiResponse({ status: 400, description: 'No uninvoiced charges found' })
  async generateInvoices(@Req() req: FastifyRequest, @Body() dto: GenerateRecoveryInvoicesDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.recoveryService.generateRecoveryInvoices(tenantId, dto.poolId, {
      propertyIds: dto.propertyIds,
      issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    });
  }

  @Get('summary/:poolId')
  @ApiOperation({ summary: 'Get allocation summary for expense pool' })
  @ApiResponse({ status: 200, description: 'Allocation summary retrieved' })
  @ApiResponse({ status: 404, description: 'Expense pool not found' })
  async getSummary(@Req() req: FastifyRequest, @Param('poolId') poolId: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.recoveryService.getAllocationSummary(tenantId, poolId);
  }

  @Delete('allocations/:poolId')
  @ApiOperation({ summary: 'Delete allocations for expense pool' })
  @ApiResponse({ status: 200, description: 'Allocations deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete allocations with invoices' })
  async deleteAllocations(@Req() req: FastifyRequest, @Param('poolId') poolId: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.recoveryService.deleteAllocations(tenantId, poolId);
  }
}
