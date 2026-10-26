import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async list(user?: any) {
    if (!user || user.role === "SUPER_ADMIN") {
      return this.prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    const allowedTenantIds = user.tenantAccess?.map((ta: any) => ta.tenantId) || [];
    if (user.tenantId && !allowedTenantIds.includes(user.tenantId)) {
      allowedTenantIds.push(user.tenantId);
    }

    return this.prisma.tenant.findMany({
      where: {
        id: { in: allowedTenantIds },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(name: string) {
    if (!name || name.trim().length === 0) {
      throw new BadRequestException("Property name is required");
    }

    const id = "prop_" + Math.random().toString(36).substr(2, 9);
    
    return this.prisma.tenant.create({
      data: {
        id,
        name: name.trim(),
      },
    });
  }
}
