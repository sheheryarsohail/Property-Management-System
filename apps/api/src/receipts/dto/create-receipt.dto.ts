// receipts/dto/create-receipt.dto.ts
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ReceiptMethod } from '@prisma/client';

export class CreateReceiptDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() category?: string; // Manual receipt number
  @IsOptional() @IsString() invoiceId?: string;
  @IsString() customerId!: string;
  @IsOptional() @IsString() propertyId?: string;
  @IsNumber() amount!: number;
  @IsEnum(ReceiptMethod) method!: ReceiptMethod;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() receivedAt?: Date;

  // Instrument details
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() chequeNumber?: string;
  @IsOptional() chequeDate?: Date;
  @IsOptional() @IsString() slipNumber?: string;
}
