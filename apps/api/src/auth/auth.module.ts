import { Module } from '@nestjs/common';
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
