import os

path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/transfers/transfers.service.ts'
content = """import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferDto, UpdateTransferDto, ApproveTransferDto, TransferStatus } from '../dto/transfers.dto';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all transfers with optional filters
   */
  async list(tenantId: string, filters?: { propertyId?: string; status?: TransferStatus }) {
    return this.prisma.ownershipTransfer.findMany({
      where: {
        tenantId,
        propertyId: filters?.propertyId || undefined,
        status: filters?.status ? filters.status : undefined,
      },
      include: {
        property: { select: { id: true, code: true, title: true, block: true, type: true, sizeSqYd: true } },
        from: { select: { id: true, code: true, fullName: true, nationalId: true, phone: true } },
        to: { select: { id: true, code: true, fullName: true, nationalId: true, phone: true } },
        receipt: { select: { id: true, code: true, amount: true, method: true, category: true, receivedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single transfer by ID
   */
  async get(tenantId: string, transferId: string) {
    const transfer = await this.prisma.ownershipTransfer.findFirst({
      where: { tenantId, id: transferId },
      include: {
        property: true,
        from: true,
        to: true,
        receipt: true,
      },
    });

    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  /**
   * Create a new transfer.
   * If autoExecute is true (default), directly approves and executes ownership transfer,
   * transfers unpaid invoices, and generates a transfer fee receipt if transferFee > 0.
   */
  async create(tenantId: string, dto: CreateTransferDto) {
    // Validate property exists
    const property = await this.prisma.property.findFirst({
      where: { tenantId, id: dto.propertyId },
    });
    if (!property) throw new NotFoundException('Property not found');

    // Validate customers exist
    const [fromCustomer, toCustomer] = await Promise.all([
      this.prisma.customer.findFirst({ where: { tenantId, id: dto.fromCustomerId } }),
      this.prisma.customer.findFirst({ where: { tenantId, id: dto.toCustomerId } }),
    ]);

    if (!fromCustomer) throw new NotFoundException('Previous owner not found');
    if (!toCustomer) throw new NotFoundException('New owner not found');

    // Check current ownership
    const currentOwnership = await this.prisma.ownership.findFirst({
      where: { tenantId, propertyId: dto.propertyId, endDate: null },
      orderBy: { startDate: 'desc' },
    });

    if (!currentOwnership) {
      throw new BadRequestException('Property has no active ownership');
    }

    if (currentOwnership.customerId !== dto.fromCustomerId) {
      throw new BadRequestException('From customer is not the current owner');
    }

    // Create snapshots
    const previousOwnerSnapshot = {
      id: fromCustomer.id,
      code: fromCustomer.code,
      fullName: fromCustomer.fullName,
      fatherName: fromCustomer.fatherName,
      husbandName: fromCustomer.husbandName,
      email: fromCustomer.email,
      phone: fromCustomer.phone,
      mobile: fromCustomer.mobile,
      nationalId: fromCustomer.nationalId,
      address: fromCustomer.address,
    };

    const newOwnerSnapshot = {
      id: toCustomer.id,
      code: toCustomer.code,
      fullName: toCustomer.fullName,
      fatherName: toCustomer.fatherName,
      husbandName: toCustomer.husbandName,
      email: toCustomer.email,
      phone: toCustomer.phone,
      mobile: toCustomer.mobile,
      nationalId: toCustomer.nationalId,
      address: toCustomer.address,
    };

    const propertySnapshot = {
      id: property.id,
      code: property.code,
      title: property.title,
      type: property.type,
      block: property.block,
      sizeSqYd: property.sizeSqYd,
      isCorner: property.isCorner,
      isWestOpen: property.isWestOpen,
      isRoadFacing: property.isRoadFacing,
      isParkingFacing: property.isParkingFacing,
    };

    const transferDate = new Date(dto.transferDate || new Date());
    const shouldAutoExecute = dto.autoExecute !== false; // Default true!

    if (!shouldAutoExecute) {
      // Create transfer as DRAFT
      return this.prisma.ownershipTransfer.create({
        data: {
          tenantId,
          propertyId: dto.propertyId,
          fromCustomer: dto.fromCustomerId,
          toCustomer: dto.toCustomerId,
          transferType: dto.transferType,
          transferDate,
          status: TransferStatus.DRAFT,
          previousOwnerSnapshot,
          newOwnerSnapshot,
          propertySnapshot,
          nocAttachment: dto.nocAttachment,
          affidavitAttachment: dto.affidavitAttachment,
          applicationAttachment: dto.applicationAttachment,
          notes: dto.notes,
          transferFee: dto.transferFee ? Number(dto.transferFee) : null,
        },
        include: {
          property: true,
          from: true,
          to: true,
          receipt: true,
        },
      });
    }

    // AUTO-EXECUTE TRANSFER: 1-step execution directly in a transaction
    return this.prisma.$transaction(async (tx) => {
      let createdReceipt: any = null;

      // 1. Generate Transfer Fee receipt if fee > 0
      if (dto.transferFee && Number(dto.transferFee) > 0) {
        const count = await tx.receipt.count({
          where: {
            tenantId,
            NOT: { code: { startsWith: 'DEV-' } },
          },
        });
        const receiptCode = `REC-${count + 1}`;

        createdReceipt = await tx.receipt.create({
          data: {
            tenantId,
            code: receiptCode,
            category: 'TRANSFER_FEE',
            customerId: dto.toCustomerId, // New buyer pays the fee
            propertyId: dto.propertyId,
            amount: Number(dto.transferFee),
            method: (dto.paymentMethod as any) || 'CASH',
            reference: dto.reference || `Transfer fee for Plot ${property.code}`,
            notes: dto.notes ? `Transfer fee: ${dto.notes}` : `Transfer fee for Plot ${property.code}`,
            receivedAt: transferDate,
            bankName: dto.bankName,
            chequeNumber: dto.chequeNumber,
            status: 'POSTED',
          },
        });
      }

      // 2. Transfer unpaid invoices to new owner
      await tx.invoice.updateMany({
        where: {
          tenantId,
          propertyId: dto.propertyId,
          customerId: dto.fromCustomerId,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        data: {
          customerId: dto.toCustomerId,
        },
      });

      // 3. Close current ownership
      await tx.ownership.updateMany({
        where: {
          tenantId,
          propertyId: dto.propertyId,
          endDate: null,
        },
        data: {
          endDate: transferDate,
        },
      });

      // 4. Create new ownership
      await tx.ownership.create({
        data: {
          tenantId,
          propertyId: dto.propertyId,
          customerId: dto.toCustomerId,
          startDate: transferDate,
        },
      });

      // 5. Create OwnershipTransfer record as APPROVED
      return tx.ownershipTransfer.create({
        data: {
          tenantId,
          propertyId: dto.propertyId,
          fromCustomer: dto.fromCustomerId,
          toCustomer: dto.toCustomerId,
          transferType: dto.transferType,
          transferDate,
          status: TransferStatus.APPROVED,
          duesCleared: true,
          previousOwnerSnapshot,
          newOwnerSnapshot,
          propertySnapshot,
          nocAttachment: dto.nocAttachment,
          affidavitAttachment: dto.affidavitAttachment,
          applicationAttachment: dto.applicationAttachment,
          notes: dto.notes,
          transferFee: dto.transferFee ? Number(dto.transferFee) : null,
          receiptId: createdReceipt ? createdReceipt.id : null,
        },
        include: {
          property: true,
          from: true,
          to: true,
          receipt: true,
        },
      });
    });
  }

  /**
   * Submit a transfer for approval (kept for backward compatibility)
   */
  async submit(tenantId: string, transferId: string) {
    const transfer = await this.get(tenantId, transferId);

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT transfers can be submitted');
    }

    return this.prisma.ownershipTransfer.update({
      where: { id: transferId },
      data: { status: TransferStatus.SUBMITTED },
      include: {
        property: true,
        from: true,
        to: true,
        receipt: true,
      },
    });
  }

  /**
   * Approve a transfer and execute ownership change
   * Can be approved directly from DRAFT or SUBMITTED status!
   */
  async approve(
    tenantId: string,
    transferId: string,
    opts?: {
      adminOverride?: boolean;
      adminOverrideReason?: string;
      adminOverrideBy?: string;
      transferFee?: number;
      paymentMethod?: string;
      bankName?: string;
      chequeNumber?: string;
    },
  ) {
    const transfer = await this.get(tenantId, transferId);

    if (transfer.status === TransferStatus.APPROVED) {
      throw new BadRequestException('Transfer has already been approved');
    }

    if (transfer.status === TransferStatus.REJECTED) {
      throw new BadRequestException('Cannot approve a rejected transfer');
    }

    // Check for outstanding dues
    const outstandingInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        propertyId: transfer.propertyId,
        customerId: transfer.fromCustomer,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
    });

    const hasOutstandingDues = outstandingInvoices.some(
      (inv) => Number(inv.total) > Number(inv.paid),
    );

    return this.prisma.$transaction(async (tx) => {
      let receiptId = transfer.receiptId;

      // Create fee receipt if transfer fee is provided and no receipt exists
      const feeAmount = opts?.transferFee || (transfer.transferFee ? Number(transfer.transferFee) : 0);
      if (feeAmount > 0 && !receiptId) {
        const count = await tx.receipt.count({
          where: {
            tenantId,
            NOT: { code: { startsWith: 'DEV-' } },
          },
        });
        const receiptCode = `REC-${count + 1}`;

        const createdReceipt = await tx.receipt.create({
          data: {
            tenantId,
            code: receiptCode,
            category: 'TRANSFER_FEE',
            customerId: transfer.toCustomer,
            propertyId: transfer.propertyId,
            amount: feeAmount,
            method: (opts?.paymentMethod as any) || 'CASH',
            reference: `Transfer fee for Plot ${transfer.property?.code || ''}`,
            notes: `Transfer fee for Plot ${transfer.property?.code || ''}`,
            receivedAt: transfer.transferDate,
            bankName: opts?.bankName,
            chequeNumber: opts?.chequeNumber,
            status: 'POSTED',
          },
        });
        receiptId = createdReceipt.id;
      }

      // Transfer unpaid invoices to new owner
      await tx.invoice.updateMany({
        where: {
          tenantId,
          propertyId: transfer.propertyId,
          customerId: transfer.fromCustomer,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        data: {
          customerId: transfer.toCustomer,
        },
      });

      // Close current ownership
      await tx.ownership.updateMany({
        where: {
          tenantId,
          propertyId: transfer.propertyId,
          endDate: null,
        },
        data: {
          endDate: transfer.transferDate,
        },
      });

      // Create new ownership
      await tx.ownership.create({
        data: {
          tenantId,
          propertyId: transfer.propertyId,
          customerId: transfer.toCustomer,
          startDate: transfer.transferDate,
        },
      });

      // Update transfer status
      return tx.ownershipTransfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.APPROVED,
          duesCleared: !hasOutstandingDues,
          adminOverride: opts?.adminOverride || false,
          adminOverrideReason: opts?.adminOverrideReason,
          adminOverrideBy: opts?.adminOverrideBy,
          transferFee: feeAmount > 0 ? feeAmount : transfer.transferFee,
          receiptId,
        },
        include: {
          property: true,
          from: true,
          to: true,
          receipt: true,
        },
      });
    });
  }

  /**
   * Reject a transfer
   */
  async reject(tenantId: string, transferId: string, reason?: string) {
    const transfer = await this.get(tenantId, transferId);

    if (transfer.status === TransferStatus.APPROVED) {
      throw new BadRequestException('Cannot reject an already approved transfer');
    }

    return this.prisma.ownershipTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.REJECTED,
        notes: reason ? `${transfer.notes || ''}\\nRejection reason: ${reason}` : transfer.notes,
      },
      include: {
        property: true,
        from: true,
        to: true,
        receipt: true,
      },
    });
  }

  /**
   * Update transfer attachments and notes
   */
  async update(tenantId: string, transferId: string, updates: any) {
    const transfer = await this.get(tenantId, transferId);

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT transfers can be updated');
    }

    return this.prisma.ownershipTransfer.update({
      where: { id: transferId },
      data: updates,
      include: {
        property: true,
        from: true,
        to: true,
        receipt: true,
      },
    });
  }

  /**
   * Delete a transfer (only DRAFT or REJECTED)
   */
  async delete(tenantId: string, transferId: string) {
    const transfer = await this.get(tenantId, transferId);

    if (![TransferStatus.DRAFT, TransferStatus.REJECTED].includes(transfer.status as any)) {
      throw new BadRequestException('Only DRAFT or REJECTED transfers can be deleted');
    }

    await this.prisma.ownershipTransfer.delete({
      where: { id: transferId },
    });

    return { deleted: true, transferId };
  }
}
"""

with open(path, 'w') as f:
    f.write(content)
print("Successfully written", path)
