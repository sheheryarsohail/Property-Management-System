import { Controller, Get, Post, Body, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { 
  LoginDto, 
  RegisterDto, 
  ChangePasswordDto, 
  UpdateProfileDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto
} from '../dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @TenantId() tenantId: string) {
    return this.authService.login(dto, tenantId);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @TenantId() tenantId: string) {
    return this.authService.register(dto, tenantId);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-reset-code')
  async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(dto);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Get('me')
  @Post('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
}
