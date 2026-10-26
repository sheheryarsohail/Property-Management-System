import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Length } from 'class-validator';
import { UserRole } from '@prisma/client';

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  customerId?: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class VerifyResetCodeDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    customerId?: string;
    allowedTabs?: string[];
    authorizedTenants?: { id: string; name: string }[];
  };
}
