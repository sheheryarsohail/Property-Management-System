import { IsDateString, IsNumber, IsOptional, IsString, Min, ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReceiptDto {
  @IsString() customerId!: string;
  @IsString() propertyId!: string;

  @IsDateString() date!: string;

  @IsString() mode!: string; // Cash | BankTransfer | Cheque | ...

  @IsNumber() @Min(0.01)
  amount!: number;

  @IsOptional()
  instrument?: any;
}

export class AllocationLineDto {
  @IsString() invoiceId!: string;

  @IsNumber() @Min(0.01)
  amount!: number;
}

export class AllocateReceiptDto {
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AllocationLineDto)
  lines!: AllocationLineDto[];
}
