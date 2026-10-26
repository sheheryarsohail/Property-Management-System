import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CommunicationService } from './communication.service';
import { CreateCommunicationDto, SendReminderDto, CommChannel } from '../dto/communication.dto';
import { ApiKeyProtected } from '../auth/api-key.decorator';

@ApiKeyProtected()
@ApiTags('communication')
@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post()
  @ApiOperation({ summary: 'Log a communication' })
  @ApiResponse({ status: 201, description: 'Communication logged' })
  async log(@Req() req: FastifyRequest, @Body() dto: CreateCommunicationDto) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.communicationService.log(tenantId, {
      channel: dto.channel as any,
      customerId: dto.customerId,
      propertyId: dto.propertyId,
      invoiceId: dto.invoiceId,
      subject: dto.subject,
      body: dto.body,
    });
  }

  @Get('history')
  @ApiOperation({ summary: 'Get communication history' })
  @ApiResponse({ status: 200, description: 'Communication history retrieved' })
  async getHistory(
    @Req() req: FastifyRequest,
    @Query('customerId') customerId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('channel') channel?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.communicationService.getHistory(tenantId, {
      customerId,
      propertyId,
      invoiceId,
      channel: channel as any,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('reminders/due-invoices')
  @ApiOperation({ summary: 'Send reminders for due invoices (decoupled via BullMQ)' })
  @ApiResponse({ status: 200, description: 'Reminders queued' })
  async sendDueInvoiceReminders(
    @Req() req: FastifyRequest,
    @Body() dto: { channel?: CommChannel; daysBeforeDue?: number; customerIds?: string[]; propertyIds?: string[] },
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.communicationService.sendDueInvoiceReminders(tenantId, (dto?.channel || 'EMAIL') as any, {
      daysBeforeDue: dto?.daysBeforeDue,
      customerIds: dto?.customerIds,
      propertyIds: dto?.propertyIds,
    });
  }

  @Post('reminders/overdue-invoices')
  @ApiOperation({ summary: 'Send reminders for overdue invoices (decoupled via BullMQ)' })
  @ApiResponse({ status: 200, description: 'Reminders queued' })
  async sendOverdueInvoiceReminders(
    @Req() req: FastifyRequest,
    @Body() dto: { channel?: CommChannel; customerIds?: string[]; propertyIds?: string[] },
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.communicationService.sendOverdueInvoiceReminders(tenantId, (dto?.channel || 'EMAIL') as any, {
      customerIds: dto?.customerIds,
      propertyIds: dto?.propertyIds,
    });
  }

  @Post('reminders/pdc-deposits')
  @ApiOperation({ summary: 'Send PDC deposit reminders (decoupled via BullMQ)' })
  @ApiResponse({ status: 200, description: 'Reminders queued' })
  async sendPdcDepositReminders(
    @Req() req: FastifyRequest,
    @Body() dto: { channel?: CommChannel; daysBeforeDeposit?: number; customerIds?: string[] },
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.communicationService.sendPdcDepositReminders(tenantId, (dto?.channel || 'EMAIL') as any, {
      daysBeforeDeposit: dto?.daysBeforeDeposit,
      customerIds: dto?.customerIds,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get communication statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(
    @Req() req: FastifyRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.communicationService.getStats(
      tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}
