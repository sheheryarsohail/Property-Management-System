import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PlanComponentType {
  BOOKING = 'BOOKING',
  CONFIRMATION = 'CONFIRMATION',
  INSTALLMENT = 'INSTALLMENT',
  HALF_YEARLY = 'HALF_YEARLY',
  YEARLY = 'YEARLY',
}

export class PlanComponentDto {
  @ApiProperty({ enum: PlanComponentType })
  @IsEnum(PlanComponentType)
  type: PlanComponentType;

  @ApiProperty({ description: 'Amount for this component' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Number of terms (months or periods)', minimum: 1 })
  @IsNumber()
  @Min(1)
  @Max(120)
  terms: number;

  @ApiPropertyOptional({ description: 'Start date for this component' })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class CreatePaymentPlanDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Plan title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Total amount' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'PKR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Plan start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Plan components (booking, installments, etc.)', type: [PlanComponentDto] })
  components: PlanComponentDto[];

  @ApiPropertyOptional({ description: 'Auto-generate invoices', default: true })
  @IsOptional()
  autoGenerateInvoices?: boolean;
}

export class UpdatePaymentPlanDto {
  @ApiPropertyOptional({ description: 'Plan title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;
}
