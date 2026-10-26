import os

test_base = "/home/sheheryar-sohail/Downloads/Property-Management-System-test"

# 1. Update apps/api/src/dto/auth.dto.ts
auth_dto_path = os.path.join(test_base, "apps/api/src/dto/auth.dto.ts")
auth_dto_content = """import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Length } from 'class-validator';
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
    authorizedTenants?: { id: string; name: string }[];
  };
}
"""
with open(auth_dto_path, "w", encoding="utf-8") as f:
    f.write(auth_dto_content)
print("Updated auth.dto.ts")

# 2. Update apps/api/src/mailer/mailer.service.ts
mailer_service_path = os.path.join(test_base, "apps/api/src/mailer/mailer.service.ts")
mailer_service_content = """import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === '1', // true = 465
          auth: {
            user,
            pass: pass || undefined,
          },
        });
        this.logger.log(`SMTP transporter configured for ${user} on ${host}`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize SMTP transporter: ${err?.message}`);
        this.transporter = null;
      }
    } else {
      this.logger.warn('SMTP credentials not fully set. MailerService running in fallback/logger mode.');
    }
  }

  async send(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: { filename: string; content: Buffer; contentType?: string }[];
  }) {
    const from = process.env.SMTP_FROM ?? 'Property Suite <no-reply@ssestateandmarketing.com>';

    if (!this.transporter || !process.env.SMTP_PASS) {
      this.logger.log(`[MOCK/LOG EMAIL DISPATCH] To: ${options.to} | Subject: ${options.subject}`);
      return { ok: true, mocked: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from,
        ...options,
      });
      this.logger.log(`Email successfully sent to ${options.to} (ID: ${info.messageId})`);
      return { ok: true, info };
    } catch (err: any) {
      this.logger.error(`Error sending email to ${options.to}: ${err?.message || err}`);
      return { ok: false, error: err?.message || String(err) };
    }
  }

  async sendResetCodeEmail(to: string, code: string, name?: string) {
    const recipientName = name || 'User';
    const subject = `Your Password Reset Code: ${code} - Property Suite`;
    const text = `Hello ${recipientName},\\n\\nYour password reset verification code is: ${code}\\n\\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.\\n\\nRegards,\\nProperty Suite Security Team`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Code</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; background-color: #f1f5f9; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 32px 32px 20px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Property Suite</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0 0;">Account Verification & Security</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Password Reset Request</h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-top: 0;">
                Hello <strong>${recipientName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                We received a request to reset your password. Use the 6-digit verification code below to authorize your password change:
              </p>
              
              <div style="margin: 28px 0; text-align: center;">
                <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px; padding: 16px 32px;">
                  <span style="font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7;">${code}</span>
                </div>
                <p style="font-size: 12px; color: #64748b; margin-top: 10px; margin-bottom: 0;">
                  ⏱ This code is valid for <strong>10 minutes</strong> only.
                </p>
              </div>

              <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 4px; margin-top: 24px;">
                <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
                  <strong>Security Reminder:</strong> If you did not make this request, you can safely ignore this email. Your current password remains unchanged.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                © ${new Date().getFullYear()} Property Suite. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.send({
      to,
      subject,
      text,
      html,
    });
  }

  async sendPdf(to: string, subject: string, bodyText: string, filename: string, pdf: Buffer) {
    return this.send({
      to,
      subject,
      text: bodyText,
      html: `<p>${bodyText}</p>`,
      attachments: [{ filename, content: pdf, contentType: 'application/pdf' }],
    });
  }

  async verify(): Promise<{ ok: boolean; error?: string }> {
    if (!this.transporter) return { ok: false, error: 'Transporter not configured' };
    try {
      await this.transporter.verify();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  }
}
"""
with open(mailer_service_path, "w", encoding="utf-8") as f:
    f.write(mailer_service_content)
print("Updated mailer.service.ts")

# 3. Update apps/api/src/auth/auth.service.ts
auth_service_path = os.path.join(test_base, "apps/api/src/auth/auth.service.ts")
auth_service_content = """import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { 
  LoginDto, 
  RegisterDto, 
  AuthResponse, 
  ForgotPasswordDto, 
  VerifyResetCodeDto, 
  ResetPasswordDto 
} from '../dto/auth.dto';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis | null = null;
  private memoryStore = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {
    this.initRedis();
  }

  private initRedis() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6379),
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      this.redis.connect().catch(() => {
        this.logger.warn('Redis connect failed, using memory store for auth reset codes');
      });
    } catch (e) {
      this.logger.warn('Redis init error, using memory store for auth reset codes');
    }
  }

  private async storeResetCode(email: string, code: string, ttlSeconds = 600) {
    const key = `pwd_reset:${email.toLowerCase().trim()}`;
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.set(key, code, 'EX', ttlSeconds);
        return;
      } catch (err) {
        this.logger.warn('Redis set error, falling back to memory store', err);
      }
    }
    this.memoryStore.set(key, {
      code,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  private async getResetCode(email: string): Promise<string | null> {
    const key = `pwd_reset:${email.toLowerCase().trim()}`;
    if (this.redis && this.redis.status === 'ready') {
      try {
        const val = await this.redis.get(key);
        if (val) return val;
      } catch (err) {
        this.logger.warn('Redis get error, checking memory store fallback', err);
      }
    }
    const entry = this.memoryStore.get(key);
    if (entry) {
      if (Date.now() > entry.expiresAt) {
        this.memoryStore.delete(key);
        return null;
      }
      return entry.code;
    }
    return null;
  }

  private async deleteResetCode(email: string) {
    const key = `pwd_reset:${email.toLowerCase().trim()}`;
    if (this.redis && this.redis.status === 'ready') {
      try {
        await this.redis.del(key);
      } catch (err) {
        // ignore
      }
    }
    this.memoryStore.delete(key);
  }

  async login(dto: LoginDto, tenantId: string): Promise<AuthResponse> {
    const normalizedEmail = (dto.email || '').trim().toLowerCase();
    const normalizedPassword = (dto.password || '').trim();

    let user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
      include: { 
        customer: true,
        tenantAccess: { include: { tenant: true } }
      },
    });

    this.logger.log(`Login attempt for ${normalizedEmail}. Found user: ${!!user}`);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check tenant access
    if (user.role !== 'SUPER_ADMIN') {
      const allowedTenantIds = user.tenantAccess?.length > 0
        ? user.tenantAccess.map(ta => ta.tenantId)
        : (user.tenantId ? [user.tenantId] : []);
      if (allowedTenantIds.length === 0) {
        throw new UnauthorizedException('User has no assigned properties');
      }
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { password, tenantAccess, ...safeUser } = user;
    let authorizedTenants = [];
    
    if (user.role === 'SUPER_ADMIN') {
      const allTenants = await this.prisma.tenant.findMany({ select: { id: true, name: true } });
      authorizedTenants = [{ id: 'all', name: 'All Properties (Consolidated)' }, ...allTenants];
    } else {
      if (tenantAccess && tenantAccess.length > 0) {
        authorizedTenants = tenantAccess.map((ta: any) => ta.tenant).filter(Boolean);
      } else if (user.tenant) {
        authorizedTenants = [user.tenant];
      }
    }

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
        authorizedTenants,
      },
    };
  }

  async register(dto: RegisterDto, tenantId: string): Promise<AuthResponse> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || 'CUSTOMER',
        customerId: dto.customerId,
      },
    });

    const payload = { email: user.email, sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        customerId: user.customerId,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = (dto.email || '').trim().toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account is currently disabled. Please contact the administrator.');
    }

    // Generate secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis/memory with 10-minute expiry (600s)
    await this.storeResetCode(normalizedEmail, code, 600);

    console.log(`\\n======================================================`);
    console.log(`[AUTH] PASSWORD RESET CODE FOR ${normalizedEmail}: ${code}`);
    console.log(`[AUTH] EXPIRES IN 10 MINUTES (TTL: 600s)`);
    console.log(`======================================================\\n`);

    // Dispatch email
    await this.mailerService.sendResetCodeEmail(normalizedEmail, code, user.name);

    return {
      success: true,
      message: 'A 6-digit verification code has been sent to your email address.',
      email: normalizedEmail,
    };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const normalizedEmail = (dto.email || '').trim().toLowerCase();
    const storedCode = await this.getResetCode(normalizedEmail);

    if (!storedCode) {
      throw new BadRequestException('Verification code has expired or is invalid. Please request a new code.');
    }

    if (storedCode.trim() !== dto.code.trim()) {
      throw new BadRequestException('Invalid verification code. Please check and try again.');
    }

    return {
      valid: true,
      message: 'Verification code verified successfully.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const normalizedEmail = (dto.email || '').trim().toLowerCase();
    const storedCode = await this.getResetCode(normalizedEmail);

    if (!storedCode) {
      throw new BadRequestException('Verification code has expired or is invalid. Please request a new code.');
    }

    if (storedCode.trim() !== dto.code.trim()) {
      throw new BadRequestException('Invalid verification code. Please check and try again.');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword.trim(), 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate code after successful reset
    await this.deleteResetCode(normalizedEmail);

    this.logger.log(`Password reset completed successfully for ${normalizedEmail}`);

    return {
      success: true,
      message: 'Your password has been changed successfully. You can now sign in with your new password.',
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async updateProfile(userId: string, dto: { name?: string; email?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.email && { email: dto.email }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        customerId: true,
      },
    });
    return user;
  }
}
"""
with open(auth_service_path, "w", encoding="utf-8") as f:
    f.write(auth_service_content)
print("Updated auth.service.ts")

# 4. Update apps/api/src/auth/auth.controller.ts
auth_controller_path = os.path.join(test_base, "apps/api/src/auth/auth.controller.ts")
auth_controller_content = """import { Controller, Post, Body, UseGuards, Patch } from '@nestjs/common';
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

  @Post('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return user;
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
"""
with open(auth_controller_path, "w", encoding="utf-8") as f:
    f.write(auth_controller_content)
print("Updated auth.controller.ts")

# 5. Update apps/api/src/auth/auth.module.ts
auth_module_path = os.path.join(test_base, "apps/api/src/auth/auth.module.ts")
auth_module_content = """import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerModule } from '../mailer/mailer.module';
import { ApiKeyService } from './api-key.service';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { ScopesGuard } from './scopes.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    MailerModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || '02c69f4cc9d911c4b97ab30567b8b786dda00b8f2cead185b23ca01f892d62aa',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ApiKeyService,
    OptionalJwtAuthGuard,
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: ScopesGuard },
    Reflector,
  ],
  exports: [AuthService, ApiKeyService, JwtStrategy, OptionalJwtAuthGuard, PassportModule],
})
export class AuthModule {}
"""
with open(auth_module_path, "w", encoding="utf-8") as f:
    f.write(auth_module_content)
print("Updated auth.module.ts")

# 6. Update apps/api/.env if SMTP variables are not set
env_path = os.path.join(test_base, "apps/api/.env")
with open(env_path, "r", encoding="utf-8") as f:
    env_content = f.read()

if "SMTP_HOST" not in env_content:
    env_content += """
# SMTP Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="0"
SMTP_USER="sheheryarsohail3@gmail.com"
SMTP_PASS=""
SMTP_FROM="Property Suite <sheheryarsohail3@gmail.com>"
"""
    with open(env_path, "w", encoding="utf-8") as f:
        f.write(env_content)
    print("Updated apps/api/.env with SMTP settings")
else:
    print("apps/api/.env already has SMTP settings")

print("All API files updated successfully!")
