import { IsNumber, IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { PropertyType, PropertyStatus } from '@prisma/client';

export class CreatePropertyDto {
  @IsString()
  code!: string;

  @IsString()
  title!: string;

  @IsOptional() @IsString()
  description?: string;



  @IsOptional() @IsNumber()
  sizeSqYd?: number;

  @IsOptional() @IsEnum(PropertyType)
  type?: PropertyType;

  @IsOptional() @IsString()
  block?: string;

  // status is omitted from CreateDto since it defaults to AVAILABLE

  @IsOptional() @IsNumber()
  pricePerSqYd?: number;

  @IsOptional() @IsNumber()
  discount?: number;

  @IsOptional() @IsNumber()
  ownMoney?: number;

  @IsOptional() @IsNumber()
  bookingPrice?: number;

  @IsOptional() @IsNumber()
  confirmationPrice?: number;

  @IsOptional() @IsNumber()
  installmentPrice?: number;

  @IsOptional() @IsNumber()
  totalPrice?: number;

  @IsOptional() @IsString()
  pricingMethod?: string;

  @IsOptional() @IsNumber()
  halfYearlyPrice?: number;

  @IsOptional() @IsNumber()
  yearlyPrice?: number;

  @IsOptional() @IsNumber()
  bookingMonths?: number;

  @IsOptional() @IsNumber()
  confirmationMonths?: number;

  @IsOptional() @IsNumber()
  installmentMonths?: number;

  @IsOptional() @IsBoolean()
  autoReceiptGeneration?: boolean;

  @IsOptional() @IsBoolean()
  isCorner?: boolean;

  @IsOptional() @IsBoolean()
  isWestOpen?: boolean;

  @IsOptional() @IsBoolean()
  isRoadFacing?: boolean;

  @IsOptional() @IsBoolean()
  isParkingFacing?: boolean;
}

