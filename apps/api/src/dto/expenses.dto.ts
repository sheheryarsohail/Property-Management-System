import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsDateString() date!: string;
  @IsString() type!: string;       // Office | Development
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() subcategory?: string;
  @IsOptional() @IsString() vendor?: string;
  @IsOptional() @IsString() billNo?: string;
  @IsNumber() @Min(0.01) amount!: number;
  @IsOptional() @IsNumber() tax?: number;
  @IsOptional() @IsNumber() net?: number;
  @IsOptional() @IsString() costCenter?: string;
  @IsOptional() @IsString() project?: string;
  @IsOptional() @IsString() notes?: string;
}

export class ListExpensesQuery {
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
}
