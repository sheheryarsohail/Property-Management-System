import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { CreateCustomerDto } from '../dto/customers.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  list(tenantId: string, opts?: { q?: string }) {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        ...(opts?.q
          ? {
              OR: [
                { fullName: { contains: opts.q, mode: 'insensitive' as any } },
                { code: { contains: opts.q, mode: 'insensitive' as any } },
                { nationalId: { contains: opts.q, mode: 'insensitive' as any } },
                { phone: { contains: opts.q, mode: 'insensitive' as any } },
                { mobile: { contains: opts.q, mode: 'insensitive' as any } },
                { email: { contains: opts.q, mode: 'insensitive' as any } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { ownerships: { where: { endDate: null } } },
        },
      },
    });
  }

  get(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        ownerships: {
          include: {
            property: true,
          },
        },
      },
    });
  }

  async create(tenantId: string, input: CreateCustomerDto) {
    const count = await this.prisma.customer.count({ where: { tenantId } });
    const code = `CUST-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.customer.create({
      data: {
        tenantId,
        code,
        portalAccessId: crypto.randomUUID(),
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        nationalId: input.nationalId,
        fatherName: input.fatherName,
        husbandName: input.husbandName,
        address: input.address,
        nomineeName: input.nomineeName,
        nomineeNIC: input.nomineeNIC,
        nomineeRelation: input.nomineeRelation,
        nomineeAddress: input.nomineeAddress,
      },
    });
  }

  async updatePortalStatus(id: string, isPortalActive: boolean) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    let portalAccessId = customer.portalAccessId;
    // Auto-generate if it doesn't exist for older customers
    if (!portalAccessId && isPortalActive) {
      portalAccessId = crypto.randomUUID();
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        isPortalActive,
        portalAccessId,
      },
    });
  }

  async updatePortalCredentials(id: string, pinOrPassword?: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    let portalPassword: string | null = null;
    if (pinOrPassword && pinOrPassword.trim().length > 0) {
      portalPassword = pinOrPassword.trim();
    }

    return this.prisma.customer.update({
      where: { id },
      data: { portalPassword },
      select: {
        id: true,
        code: true,
        portalAccessId: true,
        isPortalActive: true,
        portalPassword: true,
      },
    });
  }

  async update(tenantId: string, id: string, input: any) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const nationalId = input.nationalId !== undefined ? input.nationalId : input.cnic;
    const nomineeNIC = input.nomineeNIC !== undefined ? input.nomineeNIC : input.nomineeCnic;

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.mobile !== undefined ? { mobile: input.mobile } : {}),
        ...(nationalId !== undefined ? { nationalId } : {}),
        ...(input.fatherName !== undefined ? { fatherName: input.fatherName } : {}),
        ...(input.husbandName !== undefined ? { husbandName: input.husbandName } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.nomineeName !== undefined ? { nomineeName: input.nomineeName } : {}),
        ...(nomineeNIC !== undefined ? { nomineeNIC } : {}),
        ...(input.nomineeRelation !== undefined ? { nomineeRelation: input.nomineeRelation } : {}),
        ...(input.nomineeAddress !== undefined ? { nomineeAddress: input.nomineeAddress } : {}),
        ...(input.code !== undefined ? { code: input.code } : {}),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        ownerships: { where: { endDate: null } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    if (customer.ownerships.length > 0) {
      throw new BadRequestException('Cannot delete customer with active property ownerships');
    }

    return this.prisma.customer.delete({ where: { id } });
  }

}
