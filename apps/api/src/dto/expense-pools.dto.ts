import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpensePoolDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsDateString() fromDate!: string;
  @IsDateString() toDate!: string;
  @IsOptional() @IsString() scopeBlock?: string;
  @IsString() method!: 'Equal' | 'BySize' | 'Fixed';
  @IsOptional() @IsString() notes?: string;
}

export class AttachExpensesDto {
  @IsOptional() @IsString() type?: string;     // default Development
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsString() scopeBlock?: string;
}

export class AllocatePoolDto {
  /**
   * For method="Fixed": propertyId -> fixedAmount
   * For other methods: ignore
   */
  @IsOptional() @IsObject()
  fixedMap?: Record<string, number>;
}

export class GenerateRecoveryDto {
  /** Optional notes added to DevCharge invoices */
  @IsOptional() @IsString() notes?: string;
  /** Optional: issue/due dates; if omitted, use today/today+10 */
  @IsOptional() @IsDateString() issueDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
