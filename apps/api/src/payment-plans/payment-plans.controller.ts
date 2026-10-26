import { Controller, Get, Post, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { PaymentPlansService } from './payment-plans.service';
import { CreatePaymentPlanDto } from '../dto/payment-plans.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';

@ApiKeyProtected()
@ApiTags('payment-plans')
@Controller('payment-plans')
export class PaymentPlansController {
  constructor(private readonly plansService: PaymentPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List payment plans by property' })
  @ApiResponse({ status: 200, description: 'Payment plans retrieved' })
  async list(@Req() req: FastifyRequest, @Query('propertyId') propertyId: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.plansService.listByProperty(tenantId, propertyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment plan details' })
  @ApiResponse({ status: 200, description: 'Payment plan retrieved' })
  @ApiResponse({ status: 404, description: 'Payment plan not found' })
  async get(@Req() req: FastifyRequest, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.plansService.get(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment plan' })
  @ApiResponse({ status: 201, description: 'Payment plan created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async create(@Req() req: FastifyRequest, @Body() dto: CreatePaymentPlanDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.plansService.create(tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment plan' })
  @ApiResponse({ status: 200, description: 'Payment plan deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete plan with paid invoices' })
  @ApiResponse({ status: 404, description: 'Payment plan not found' })
  async delete(@Req() req: FastifyRequest, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.plansService.delete(tenantId, id);
  }
}
