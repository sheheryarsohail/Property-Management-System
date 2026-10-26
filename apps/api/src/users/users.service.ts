import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  customerId?: string;
  tenantIds?: string[]; // Allow assigning to multiple tenants
  allowedTabs?: string[];
}

export interface UpdateUserDto {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  tenantIds?: string[];
  allowedTabs?: string[];
  password?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, currentUser: any) {
    let whereClause: any = {};
    
    if (currentUser?.role === 'SUPER_ADMIN') {
      if (tenantId && tenantId !== 'all') {
        whereClause = {
          OR: [
            { tenantId },
            { tenantAccess: { some: { tenantId } } }
          ]
        };
      } else {
        whereClause = {};
      }
    } else {
      const allowedTenants = currentUser.tenantAccess?.map((ta: any) => ta.tenantId) || [];
      if (currentUser.tenantId && !allowedTenants.includes(currentUser.tenantId)) {
        allowedTenants.push(currentUser.tenantId);
      }
      let filterTenants = allowedTenants;
      if (tenantId && tenantId !== 'all' && allowedTenants.includes(tenantId)) {
        filterTenants = [tenantId];
      }
      whereClause = {
        OR: [
          { tenantId: { in: filterTenants } },
          { tenantAccess: { some: { tenantId: { in: filterTenants } } } }
        ]
      };
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        allowedTabs: true,
        lastLoginAt: true,
        createdAt: true,
        customerId: true,
        tenantAccess: { select: { tenantId: true, tenant: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, dto: CreateUserDto, currentUser: any) {
    const allowedTenants = currentUser.tenantAccess?.map((ta: any) => ta.tenantId) || [];
    if (currentUser.tenantId && !allowedTenants.includes(currentUser.tenantId)) {
      allowedTenants.push(currentUser.tenantId);
    }

    let assignTenants = (dto.tenantIds || []).filter(t => t && t !== 'all');

    if (currentUser.role !== 'SUPER_ADMIN') {
      if (dto.role === 'SUPER_ADMIN') {
        throw new ConflictException('Only a SUPER_ADMIN can create a SUPER_ADMIN');
      }
      
      if (assignTenants.length > 0) {
        const hasUnauthorizedAssigment = assignTenants.some(t => !allowedTenants.includes(t));
        if (hasUnauthorizedAssigment) {
          throw new ConflictException('You can only assign users to properties you have access to');
        }
      } else {
        assignTenants = (tenantId && tenantId !== 'all') ? [tenantId] : allowedTenants.filter(t => t !== 'all');
      }
    } else {
      if (assignTenants.length === 0) {
        if (tenantId && tenantId !== 'all') {
          assignTenants = [tenantId];
        } else {
          const allTenants = await this.prisma.tenant.findMany({ select: { id: true } });
          assignTenants = allTenants.map(t => t.id);
        }
      }
    }

    let primaryTenantId = assignTenants[0];
    if (!primaryTenantId || primaryTenantId === 'all') {
      const fallbackTenant = await this.prisma.tenant.findFirst({ select: { id: true } });
      primaryTenantId = fallbackTenant?.id || 't_local';
      if (!assignTenants.includes(primaryTenantId)) {
        assignTenants.push(primaryTenantId);
      }
    }

    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email: cleanEmail },
    });
    if (existing) {
      throw new ConflictException(`User with email "${cleanEmail}" already exists. You can edit this user in the table to reset their password or update access.`);
    }

    const cleanPassword = (dto.password || '').trim();
    if (cleanPassword.length > 0 && cleanPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const passwordStr = cleanPassword || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(passwordStr, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId: primaryTenantId,
        email: cleanEmail,
        name: dto.name.trim(),
        password: hashedPassword,
        role: dto.role,
        customerId: dto.customerId,
        allowedTabs: dto.allowedTabs || [],
        tenantAccess: {
          create: assignTenants.map(tId => ({ tenantId: tId }))
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        allowedTabs: true,
        createdAt: true,
        tenantAccess: { select: { tenantId: true, tenant: { select: { id: true, name: true } } } },
      },
    });

    return user;
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenantAccess: true }
    });
    
    if (!user) throw new NotFoundException('User not found');

    const allowedTenants = currentUser.tenantAccess?.map((ta: any) => ta.tenantId) || [];
    if (!allowedTenants.includes(currentUser.tenantId)) {
      allowedTenants.push(currentUser.tenantId);
    }

    // Make sure we have access to this user
    if (currentUser.role !== 'SUPER_ADMIN') {
      const hasAccessToUser = user.tenantAccess.some(ta => allowedTenants.includes(ta.tenantId)) || allowedTenants.includes(user.tenantId);
      if (!hasAccessToUser) throw new NotFoundException('User not found in this property');
      
      if (dto.role && (dto.role === 'ADMIN' || dto.role === 'SUPER_ADMIN') && user.role !== dto.role) {
        throw new ConflictException('You are not authorized to promote a user to ADMIN or SUPER_ADMIN');
      }
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        throw new ConflictException('You cannot modify an ADMIN or SUPER_ADMIN');
      }
      
      if (dto.tenantIds && dto.tenantIds.length > 0) {
        const hasUnauthorizedAssigment = dto.tenantIds.some(t => !allowedTenants.includes(t));
        if (hasUnauthorizedAssigment) {
          throw new ConflictException('You can only assign users to properties you have access to');
        }
      }
    }

    const updateData: any = {
      name: dto.name,
      role: dto.role,
      isActive: dto.isActive,
    };

    if (dto.allowedTabs !== undefined) {
      updateData.allowedTabs = dto.allowedTabs;
    }

    if (dto.password !== undefined && dto.password !== null) {
      const cleanPassword = dto.password.trim();
      if (cleanPassword.length > 0) {
        if (cleanPassword.length < 6) {
          throw new BadRequestException('Password must be at least 6 characters long');
        }
        updateData.password = await bcrypt.hash(cleanPassword, 10);
      }
    }

    // If tenantIds are provided, allow SUPER_ADMIN or multi-tenant ADMIN to update them
    if (dto.tenantIds && (currentUser.role === 'SUPER_ADMIN' || allowedTenants.length > 1)) {
      const cleanTenantIds = dto.tenantIds.filter(t => t && t !== 'all');
      if (cleanTenantIds.length > 0) {
        updateData.tenantAccess = {
          deleteMany: {},
          create: cleanTenantIds.map(tId => ({ tenantId: tId }))
        };
        updateData.tenantId = cleanTenantIds[0];
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        allowedTabs: true,
        tenantAccess: { select: { tenantId: true, tenant: { select: { id: true, name: true } } } },
      },
    });
  }

  async remove(tenantId: string, id: string, currentUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { tenantAccess: true }
    });
    
    if (!user) throw new NotFoundException('User not found');

    // 1. Self-deletion guard: No user can remove themselves
    if (user.id === currentUser.id || user.id === currentUser.sub || user.email === currentUser.email) {
      throw new ConflictException('You cannot delete your own account');
    }

    // 2. Super admin immunity: SUPER_ADMIN can NEVER be deleted by anyone
    if (user.role === 'SUPER_ADMIN') {
      throw new ConflictException('SUPER_ADMIN accounts cannot be deleted');
    }

    // 3. Admin deletion rule: Only SUPER_ADMIN can delete an ADMIN
    if (user.role === 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      throw new ConflictException('Only a SUPER_ADMIN can delete an ADMIN');
    }

    // 4. Property access check for non-SUPER_ADMIN
    if (currentUser.role !== 'SUPER_ADMIN') {
      const allowedTenants = currentUser.tenantAccess?.map((ta: any) => ta.tenantId) || [];
      if (currentUser.tenantId && !allowedTenants.includes(currentUser.tenantId)) {
        allowedTenants.push(currentUser.tenantId);
      }
      const hasAccessToUser = user.tenantAccess.some(ta => allowedTenants.includes(ta.tenantId)) || allowedTenants.includes(user.tenantId);
      if (!hasAccessToUser) throw new NotFoundException('User not found in your assigned properties');
    }

    await this.prisma.userTenantAccess.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({
      where: { id },
    });
    return { success: true };
  }
}
