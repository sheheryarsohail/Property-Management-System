import { Controller, Get, Query, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ApiKeyProtected } from '../auth/api-key.decorator';

@ApiKeyProtected()
@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('property-ledger/:propertyId')
  @ApiOperation({ summary: 'Get property ledger report' })
  @ApiResponse({ status: 200, description: 'Property ledger retrieved' })
  async propertyLedger(
    @Req() req: any,
    @Param('propertyId') propertyId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.reportsService.propertyLedger(
      tenantId,
      propertyId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('customer-ledger/:customerId')
  @ApiOperation({ summary: 'Get customer ledger report (multi-plot)' })
  @ApiResponse({ status: 200, description: 'Customer ledger retrieved' })
  async customerLedger(
    @Req() req: any,
    @Param('customerId') customerId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.reportsService.customerLedger(
      tenantId,
      customerId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('aging')
  @ApiOperation({ summary: 'Get aging report' })
  @ApiResponse({ status: 200, description: 'Aging report retrieved' })
  async agingReport(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('customer') customerId?: string,
    @Query('property') propertyId?: string,
    @Query('status') status?: string,
    @Query('includeExpenses') includeExpenses?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.reportsService.agingReport(tenantId, {
      from,
      to,
      customerId,
      propertyId,
      status,
      includeExpenses: includeExpenses === 'true',
    });
  }

  @Get('financial-summary')
  @ApiOperation({ summary: 'Get financial summary report' })
  @ApiResponse({ status: 200, description: 'Financial summary report retrieved' })
  async financialSummary(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.reportsService.financialSummary(
      tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      req.user
    );
  }

  @Get('pdc-register')
  @ApiOperation({ summary: 'Get PDC register' })
  @ApiResponse({ status: 200, description: 'PDC register retrieved' })
  async pdcRegister(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.reportsService.pdcRegister(
      tenantId,
      status,
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('expense-register')
  @ApiOperation({ summary: 'Get expense register' })
  @ApiResponse({ status: 200, description: 'Expense register retrieved' })
  async expenseRegister(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('category') category?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.reportsService.expenseRegister(
      tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      category,
    );
  }

  @Get('recovery')
  @ApiOperation({ summary: 'Get recovery report' })
  @ApiResponse({ status: 200, description: 'Recovery report retrieved' })
  async recoveryReport(
    @Req() req: any,
    @Query('poolId') poolId?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.reportsService.recoveryReport(tenantId, poolId);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Get cash flow (income vs expenses) report' })
  @ApiResponse({ status: 200, description: 'Cash flow report retrieved' })
  async cashFlowReport(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    
    return this.reportsService.cashFlow(
      tenantId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }
}

