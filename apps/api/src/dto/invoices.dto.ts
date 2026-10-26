import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsString() customerId!: string;
  @IsString() propertyId!: string;

  @IsString() type!: string; // Booking | Installment | ...

  @IsNumber() @Min(0.01)
  amount!: number;

  @IsDateString() issueDate!: string;
  @IsDateString() dueDate!: string;

  @IsOptional() @IsString()
  notes?: string;
}
