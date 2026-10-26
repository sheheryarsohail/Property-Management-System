import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateOwnershipDto {
  @IsString()
  customerId!: string;

  @IsString()
  propertyId!: string;

  @IsOptional() @IsDateString()
  startDate?: string;

  @IsOptional()
  paymentPlanOverrides?: any;
}

export class TransferOwnershipDto {
  @IsString()
  propertyId!: string;

  @IsString()
  newCustomerId!: string;

  @IsOptional() @IsDateString()
  transferDate?: string;
}
