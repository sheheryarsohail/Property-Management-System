import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AllocationMethod {
  BY_COUNT = 'BY_COUNT',       // Equal split among all properties
  BY_SIZE = 'BY_SIZE',         // Proportional to plot size
  FIXED = 'FIXED',             // Manual allocation
}

export class AllocateExpensePoolDto {
  @ApiProperty({ description: 'Expense pool ID' })
  @IsString()
  poolId: string;

  @ApiProperty({ enum: AllocationMethod, description: 'Allocation method' })
  @IsEnum(AllocationMethod)
  method: AllocationMethod;

  @ApiPropertyOptional({ description: 'Property IDs to allocate to (if not all)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyIds?: string[];

  @ApiPropertyOptional({ description: 'Fixed allocations (for FIXED method)', type: 'object' })
  @IsOptional()
  fixedAllocations?: Record<string, number>; // propertyId -> amount

  @ApiPropertyOptional({ description: 'Charge title override' })
  @IsOptional()
  @IsString()
  chargeTitle?: string;

  @ApiPropertyOptional({ description: 'Charge date' })
  @IsOptional()
  @IsDateString()
  chargeDate?: string;
}

export class GenerateRecoveryInvoicesDto {
  @ApiProperty({ description: 'Expense pool ID' })
  @IsString()
  poolId: string;

  @ApiPropertyOptional({ description: 'Invoice issue date' })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiPropertyOptional({ description: 'Invoice due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Only generate for specific properties' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyIds?: string[];
}

export class AllocationSummaryDto {
  poolId: string;
  poolTitle: string;
  totalExpenses: number;
  totalAllocated: number;
  allocationMethod: string;
  allocations: Array<{
    propertyId: string;
    propertyCode: string;
    propertyTitle: string;
    amount: number;
    share: number;
    customerId?: string;
    customerName?: string;
  }>;
}
