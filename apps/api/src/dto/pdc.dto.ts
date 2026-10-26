import { IsArray, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePdcDto {
  @IsString() customerId!: string;
  @IsOptional() @IsString() invoiceId?: string;
  @IsOptional() @IsString() propertyId?: string;

  @IsString() chequeNo!: string;
  @IsString() bank!: string;

  @IsOptional() @IsString()
  branch?: string;

  @IsNumber() @Min(0.01)
  amount!: number;

  @IsOptional() @IsDateString()
  dueDate?: string;

  @IsOptional() @IsDateString()
  chequeDate?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  code?: string;

  @IsOptional() @IsArray()
  linkedInvoiceIds?: string[];
}

export class PdcBounceDto {
  @IsOptional() @IsNumber() @Min(0)
  feeAmount?: number;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  reason?: string;
}
