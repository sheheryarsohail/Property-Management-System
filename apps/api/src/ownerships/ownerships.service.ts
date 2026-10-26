import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentPlansService } from '../payment-plans/payment-plans.service';
import { PlanComponentType } from '../dto/payment-plans.dto';

type CreateOwnershipInput = {
  customerId: string;
  propertyId: string;
  startDate?: string | Date;
  tenantId?: string;
  paymentPlanOverrides?: any;
};

@Injectable()
export class OwnershipsService {
  constructor(
    private prisma: PrismaService,
    private paymentPlansService: PaymentPlansService,
  ) {}

  listByProperty(propertyId: string) {
    return this.prisma.ownership.findMany({
      where: { propertyId },
      orderBy: { startDate: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, nationalId: true } },
        property: { select: { id: true, code: true } },
      },
    });
  }

  listByCustomer(customerId: string) {
    return this.prisma.ownership.findMany({
      where: { customerId },
      orderBy: { startDate: 'desc' },
      include: {
        property: { select: { id: true, code: true, status: true } },
      },
    });
  }

  /** Create a new ACTIVE ownership and generate plans if requested */
  async createActive(input: CreateOwnershipInput) {
    const startDate = input.startDate ? new Date(input.startDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      let [customer, property] = await Promise.all([
        tx.customer.findUnique({ where: { id: input.customerId } }),
        tx.property.findUnique({ where: { id: input.propertyId } }),
      ]);
      
      if (!customer) throw new NotFoundException('Customer not found');
      if (!property) throw new NotFoundException('Property not found');

      const tenantId = input.tenantId || property.tenantId;

      // Check if property is already assigned
      const existingActive = await tx.ownership.findFirst({
        where: { propertyId: input.propertyId, endDate: null },
      });
      
      if (existingActive) {
        throw new BadRequestException('Property already has an active owner');
      }

      // Determine if preliminary milestone components (booking/confirmation) exist
      const bPrice = input.paymentPlanOverrides?.bookingPrice ?? property.bookingPrice;
      const bMonths = input.paymentPlanOverrides?.bookingMonths ?? property.bookingMonths;
      const cPrice = input.paymentPlanOverrides?.confirmationPrice ?? property.confirmationPrice;
      const cMonths = input.paymentPlanOverrides?.confirmationMonths ?? property.confirmationMonths;
      const hasPreliminary = (Number(bPrice) > 0 && Number(bMonths) > 0) || (Number(cPrice) > 0 && Number(cMonths) > 0);

      // Update property status to RESERVED if booking/confirmation are required, otherwise SOLD
      const updateData: any = {};
      if (property.status === 'AVAILABLE' || property.status === 'CANCELLED') {
        updateData.status = hasPreliminary ? 'RESERVED' : 'SOLD';
      }
      if (input.paymentPlanOverrides) {
        Object.assign(updateData, input.paymentPlanOverrides);
      }
      
      if (Object.keys(updateData).length > 0) {
        property = await tx.property.update({
          where: { id: property.id },
          data: updateData,
        });
      }

      const ownership = await tx.ownership.create({
        data: {
          tenantId,
          customerId: input.customerId,
          propertyId: input.propertyId,
          startDate,
        },
      });

      // Generate payment plan automatically
      const components = [];
      
      // Add Booking
      if (property.bookingPrice && property.bookingMonths) {
        components.push({
          type: PlanComponentType.BOOKING,
          amount: Number(property.bookingPrice) * Number(property.bookingMonths),
          terms: property.bookingMonths,
          startDate: startDate.toISOString(),
        });
      }
      
      // Add Confirmation
      if (property.confirmationPrice && property.confirmationMonths) {
        components.push({
          type: PlanComponentType.CONFIRMATION,
          amount: Number(property.confirmationPrice) * Number(property.confirmationMonths),
          terms: property.confirmationMonths,
        });
      }
      
      // Add Installments
      if (property.installmentPrice && property.installmentMonths) {
        components.push({
          type: PlanComponentType.INSTALLMENT,
          amount: Number(property.installmentPrice) * Number(property.installmentMonths),
          terms: property.installmentMonths,
        });
      }

      if (components.length > 0) {
        await this.paymentPlansService.create(tenantId, {
          propertyId: property.id,
          title: `Standard Plan - ${property.code}`,
          totalAmount: Number(property.totalPrice || 0),
          currency: 'PKR',
          startDate: startDate.toISOString(),
          components,
          autoGenerateInvoices: true,
        }, tx);
      }

      return ownership;
    });
  }
}
