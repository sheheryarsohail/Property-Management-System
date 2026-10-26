import { IsOptional, IsString, Length, Matches, IsArray } from 'class-validator';

export class CreateCustomerDto {

  @IsString()
  fullName!: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  mobile?: string;

  @IsOptional() @IsString()
  nationalId?: string;

  @IsOptional() @IsString()
  fatherName?: string;

  @IsOptional() @IsString()
  husbandName?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  nomineeName?: string;

  @IsOptional() @IsString()
  nomineeNIC?: string;

  @IsOptional() @IsString()
  nomineeRelation?: string;

  @IsOptional() @IsString()
  nomineeAddress?: string;
}



export class UpdateCustomerDto {
  @IsOptional() @IsString()
  code?: string;

  @IsOptional() @IsString()
  fullName?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  mobile?: string;

  @IsOptional() @IsString()
  nationalId?: string;

  @IsOptional() @IsString()
  cnic?: string;

  @IsOptional() @IsString()
  fatherName?: string;

  @IsOptional() @IsString()
  husbandName?: string;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  nomineeName?: string;

  @IsOptional() @IsString()
  nomineeNIC?: string;

  @IsOptional() @IsString()
  nomineeCnic?: string;

  @IsOptional() @IsString()
  nomineeRelation?: string;

  @IsOptional() @IsString()
  nomineeAddress?: string;
}
