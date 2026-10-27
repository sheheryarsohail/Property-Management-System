import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from '../dto/properties.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async list(tenantId: string, opts?: { customerId?: string; assigned?: boolean; search?: string; status?: string }) {
    const searchFilter = opts?.search?.trim();

    let statusCondition: any = {};
    if (opts?.status && opts.status !== 'all') {
      if (opts.status === 'CANCELLED_AVAILABLE' || opts.status === 'CANCELLED_AND_AVAILABLE') {
        statusCondition = {
          PlotCancellation: { some: {} },
          status: { in: ['AVAILABLE', 'CANCELLED'] },
          ownerships: { none: { endDate: null } },
        };
      } else if (opts.status === 'AVAILABLE') {
        statusCondition = {
          status: 'AVAILABLE',
          PlotCancellation: { none: {} },
        };
      } else if (opts.status === 'ALL_AVAILABLE') {
        statusCondition = {
          status: { in: ['AVAILABLE', 'CANCELLED'] },
          ownerships: { none: { endDate: null } },
        };
      } else {
        statusCondition = {
          status: opts.status as any,
        };
      }
    }

    const properties = await this.prisma.property.findMany({
      where: {
        tenantId,
        ...statusCondition,
        ...(searchFilter ? {
          OR: [
            { code: { contains: searchFilter, mode: 'insensitive' } },
            { title: { contains: searchFilter, mode: 'insensitive' } },
            { block: { contains: searchFilter, mode: 'insensitive' } },
            { address: { contains: searchFilter, mode: 'insensitive' } },
          ]
        } : {}),
        ...(opts?.customerId ? {
          ownerships: {
            some: {
              customerId: opts.customerId,
            }
          }
        } : {}),
        ...(opts?.assigned ? {
          ownerships: {
            some: {
              endDate: null,
            }
          }
        } : {})
      },
      include: {
        ownerships: {
          where: { endDate: null },
          include: { customer: true }
        },
        PlotCancellation: {
          select: { id: true, cancelledAt: true },
          take: 1,
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return properties.map((prop) => {
      const hasActiveOwner = prop.ownerships && prop.ownerships.length > 0;
      const isCancelled = prop.PlotCancellation && prop.PlotCancellation.length > 0;
      const isCancelledAvailable = !hasActiveOwner && isCancelled && (prop.status === 'AVAILABLE' || prop.status === 'CANCELLED');
      const displayStatus = isCancelledAvailable ? 'Cancelled & Available' : prop.status;

      return {
        ...prop,
        isCancelledAvailable,
        displayStatus,
      };
    });
  }

  async get(tenantId: string, id: string) {
    const prop = await this.prisma.property.findFirst({
      where: { id, tenantId },
      include: {
        ownerships: {
          orderBy: { startDate: 'desc' },
          include: {
            customer: true,
          },
        },
        PlotCancellation: {
          orderBy: { cancelledAt: 'desc' },
          take: 1,
        },
        transfers: {
          where: { status: 'APPROVED' },
          orderBy: { transferDate: 'desc' },
          include: {
            from: true,
            to: true
          }
        }
      },
    });

    if (!prop) return null;

    const hasActiveOwner = prop.ownerships && prop.ownerships.some((o: any) => !o.endDate);
    const isCancelled = prop.PlotCancellation && prop.PlotCancellation.length > 0;
    const isCancelledAvailable = !hasActiveOwner && isCancelled && (prop.status === 'AVAILABLE' || prop.status === 'CANCELLED');
    const displayStatus = isCancelledAvailable ? 'Cancelled & Available' : prop.status;

    return {
      ...prop,
      isCancelledAvailable,
      displayStatus,
    };
  }

  create(tenantId: string, input: CreatePropertyDto) {
    const sizeSqYd = input.sizeSqYd ?? 0;
    const pricePerSqYd = input.pricePerSqYd ?? 0;
    const discount = input.discount ?? 0;
    const ownMoney = input.ownMoney ?? 0;
    const totalPrice = input.totalPrice ?? ((sizeSqYd * pricePerSqYd) + ownMoney - discount);

    return this.prisma.property.create({
      data: {
        tenantId,
        code: input.code,
        title: input.title,
        description: input.description,

        sizeSqYd: input.sizeSqYd,
        type: input.type,
        block: input.block,
        status: 'AVAILABLE', // Defaults to AVAILABLE
        pricePerSqYd: input.pricePerSqYd,
        discount: input.discount,
        ownMoney: input.ownMoney,
        totalPrice: totalPrice,
        bookingPrice: input.bookingPrice,
        confirmationPrice: input.confirmationPrice,
        installmentPrice: input.installmentPrice,
        halfYearlyPrice: input.halfYearlyPrice,
        yearlyPrice: input.yearlyPrice,
        bookingMonths: input.bookingMonths,
        confirmationMonths: input.confirmationMonths,
        installmentMonths: input.installmentMonths,
        autoReceiptGeneration: input.autoReceiptGeneration ?? true,
        isCorner: input.isCorner,
        isWestOpen: input.isWestOpen,
        isRoadFacing: input.isRoadFacing,
        isParkingFacing: input.isParkingFacing,
      },
    });
  }

  async update(tenantId: string, id: string, input: Partial<CreatePropertyDto>) {
    // If size/price/discount changes, recalculate totalPrice
    let totalPrice = input.totalPrice;
    // We trust the frontend's totalPrice because it handles different pricing methods (manual vs per sq yd)
    
    // First, verify property belongs to tenant
    const property = await this.prisma.property.findFirst({ where: { id, tenantId } });
    if (!property) throw new Error('Property not found');

    const updateData = { ...input };
    delete updateData.pricingMethod;

    return this.prisma.property.update({
      where: { id },
      data: {
        ...updateData,
        ...(totalPrice !== undefined && { totalPrice }),
      },
    });
  }
  async correctCustomer(tenantId: string, propertyId: string, newCustomerId: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Verify property and customer exist
      const [property, newCustomer] = await Promise.all([
        tx.property.findUnique({ where: { id: propertyId, tenantId } }),
        tx.customer.findUnique({ where: { id: newCustomerId, tenantId } }),
      ]);
      
      if (!property) throw new Error('Property not found');
      if (!newCustomer) throw new Error('New customer not found');

      // 2. Find active ownership
      const activeOwnership = await tx.ownership.findFirst({
        where: { propertyId, tenantId, endDate: null },
      });

      if (!activeOwnership) {
        throw new Error('Property is not currently assigned to any customer');
      }

      if (activeOwnership.customerId === newCustomerId) {
        throw new Error('Property is already assigned to this customer');
      }

      // 3. Update Ownership
      await tx.ownership.update({
        where: { id: activeOwnership.id },
        data: { customerId: newCustomerId },
      });

      // 4. Update Invoices for this property
      await tx.invoice.updateMany({
        where: { propertyId, tenantId },
        data: { customerId: newCustomerId },
      });

      // 5. Update Receipts for this property
      await tx.receipt.updateMany({
        where: { propertyId, tenantId },
        data: { customerId: newCustomerId },
      });

      // 6. Update PDCs linked to this property's invoices
      // Since PDC doesn't have a direct propertyId, we find invoices first
      const propertyInvoices = await tx.invoice.findMany({
        where: { propertyId, tenantId },
        select: { id: true },
      });
      const invoiceIds = propertyInvoices.map((inv) => inv.id);

      if (invoiceIds.length > 0) {
        await tx.postDatedCheque.updateMany({
          where: { invoiceId: { in: invoiceIds }, tenantId },
          data: { customerId: newCustomerId },
        });
      }

      return { success: true, message: 'Customer assignment corrected successfully' };
    });
  }
}
