import { IsString, IsDateString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransferType {
  SALE = 'SALE',
  GIFT = 'GIFT',
  INHERITANCE = 'INHERITANCE',
  INTERNAL = 'INTERNAL',
}

export enum TransferStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class CreateTransferDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  propertyId: string;

  @ApiProperty({ description: 'Previous owner customer ID' })
  @IsString()
  fromCustomerId: string;

  @ApiProperty({ description: 'New owner customer ID' })
  @IsString()
  toCustomerId: string;

  @ApiProperty({ enum: TransferType, description: 'Type of transfer' })
  @IsEnum(TransferType)
  transferType: TransferType;

  @ApiProperty({ description: 'Transfer date' })
  @IsDateString()
  transferDate: string;

  @ApiPropertyOptional({ description: 'Transfer fee amount' })
  @IsOptional()
  transferFee?: number;

  @ApiPropertyOptional({ description: 'Payment method for transfer fee' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Cheque or instrument number' })
  @IsOptional()
  @IsString()
  chequeNumber?: string;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Execute and approve transfer immediately', default: true })
  @IsOptional()
  @IsBoolean()
  autoExecute?: boolean;

  @ApiPropertyOptional({ description: 'NOC attachment URL' })
  @IsOptional()
  @IsString()
  nocAttachment?: string;

  @ApiPropertyOptional({ description: 'Affidavit attachment URL' })
  @IsOptional()
  @IsString()
  affidavitAttachment?: string;

  @ApiPropertyOptional({ description: 'Application attachment URL' })
  @IsOptional()
  @IsString()
  applicationAttachment?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateTransferDto {
  @ApiPropertyOptional({ enum: TransferStatus, description: 'Transfer status' })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @ApiPropertyOptional({ description: 'Transfer fee amount' })
  @IsOptional()
  transferFee?: number;

  @ApiPropertyOptional({ description: 'NOC attachment URL' })
  @IsOptional()
  @IsString()
  nocAttachment?: string;

  @ApiPropertyOptional({ description: 'Affidavit attachment URL' })
  @IsOptional()
  @IsString()
  affidavitAttachment?: string;

  @ApiPropertyOptional({ description: 'Application attachment URL' })
  @IsOptional()
  @IsString()
  applicationAttachment?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveTransferDto {
  @ApiPropertyOptional({ description: 'Admin override if dues not cleared', default: false })
  @IsOptional()
  @IsBoolean()
  adminOverride?: boolean;

  @ApiPropertyOptional({ description: 'Reason for admin override' })
  @IsOptional()
  @IsString()
  adminOverrideReason?: string;

  @ApiPropertyOptional({ description: 'Transfer fee amount if collecting at approval' })
  @IsOptional()
  transferFee?: number;

  @ApiPropertyOptional({ description: 'Payment method for transfer fee' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Cheque or instrument number' })
  @IsOptional()
  @IsString()
  chequeNumber?: string;
}
