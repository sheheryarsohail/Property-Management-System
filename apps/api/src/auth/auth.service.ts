import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
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
        tenant: true,
        tenantAccess: { include: { tenant: true } }
      },
    });

    this.logger.log(`Login attempt for ${normalizedEmail}. Found user: ${!!user}`);

    if (!user) {
      throw new UnauthorizedException('No account found with this email address');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated. Please contact an administrator');
    }

    // Check tenant access
    if (user.role !== 'SUPER_ADMIN') {
      const allowedTenantIds = user.tenantAccess?.length > 0
        ? user.tenantAccess.map(ta => ta.tenantId)
        : (user.tenantId ? [user.tenantId] : []);
      if (allowedTenantIds.length === 0) {
        throw new UnauthorizedException('User account has no assigned properties');
      }
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password. Please verify your password or use "Forgot password?" below');
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
      } else if (user.tenantId) {
        authorizedTenants = [{ id: user.tenantId, name: 'Assigned Property' }];
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
        allowedTabs: user.allowedTabs || [],
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

    console.log(`\n======================================================`);
    console.log(`[AUTH] PASSWORD RESET CODE FOR ${normalizedEmail}: ${code}`);
    console.log(`[AUTH] EXPIRES IN 10 MINUTES (TTL: 600s)`);
    console.log(`======================================================\n`);

    // Dispatch email
    const emailResult = await this.mailerService.sendResetCodeEmail(normalizedEmail, code, user.name);

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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: true,
        tenant: true,
        tenantAccess: { include: { tenant: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let authorizedTenants: any[] = [];
    if (user.role === 'SUPER_ADMIN') {
      const allTenants = await this.prisma.tenant.findMany({ select: { id: true, name: true } });
      authorizedTenants = [{ id: 'all', name: 'All Properties (Consolidated)' }, ...allTenants];
    } else {
      if (user.tenantAccess && user.tenantAccess.length > 0) {
        authorizedTenants = user.tenantAccess.map((ta: any) => ta.tenant).filter(Boolean);
      } else if (user.tenant) {
        authorizedTenants = [user.tenant];
      } else if (user.tenantId) {
        authorizedTenants = [{ id: user.tenantId, name: 'Assigned Property' }];
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customerId,
      allowedTabs: user.allowedTabs || [],
      authorizedTenants,
    };
  }
}
