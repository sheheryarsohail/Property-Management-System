import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ReceiptMethod } from '@prisma/client';

export class UpdateReceiptDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @Type(() => Number) @IsNumber() amount?: number;
  @IsOptional() @IsEnum(ReceiptMethod) method?: ReceiptMethod;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() receivedAt?: string | Date;

  // Instrument details
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() chequeNumber?: string;
  @IsOptional() chequeDate?: string | Date;
  @IsOptional() @IsString() slipNumber?: string;
}
