import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET || '02c69f4cc9d911c4b97ab30567b8b786dda00b8f2cead185b23ca01f892d62aa';
    console.log('JwtStrategy constructed with secret length:', secret.length);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    console.log('JwtStrategy payload:', payload);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { 
        customer: true,
        tenantAccess: true,
      },
    });

    if (!user) {
      return null;
    }

    if (user.role === 'SUPER_ADMIN') {
      return user;
    }

    // Skip tenant-level authorization for tenant-agnostic routes
    const path = req.originalUrl || req.url || '';
    const isTenantAgnostic = path.includes('/tenants') || path.includes('/auth/');
    if (isTenantAgnostic) {
      return user;
    }

    const tenantIdHeader = req.headers['x-tenant-id'];
    const tenantId = typeof tenantIdHeader === 'string' ? tenantIdHeader : (tenantIdHeader?.[0] || 't_local');
    
    // 'all' is a special keyword used for consolidated views, strictly for SUPER_ADMIN
    if (tenantId === 'all') {
      return null; // Deny access
    }

    const allowedTenantIds = user.tenantAccess?.length > 0
      ? user.tenantAccess.map(ta => ta.tenantId)
      : (user.tenantId ? [user.tenantId] : []);

    if (!allowedTenantIds.includes(tenantId)) {
      console.log(`Access denied for user ${user.email}: requested tenant ${tenantId} not in ${allowedTenantIds}`);
      return null; // Deny access
    }

    return user;
  }
}
