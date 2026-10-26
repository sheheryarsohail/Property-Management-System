import re
import os
import sys

def update_file(path, replacements):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return False
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    for old, new in replacements:
        if old not in new_content:
            print(f"Target not found in {path}:\n{old[:100]}...")
            return False
        new_content = new_content.replace(old, new, 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully updated: {path}")
    return True

# 1. Update payment-plans.service.ts in test
payment_plans_service_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/payment-plans/payment-plans.service.ts"

with open(payment_plans_service_path, 'r', encoding='utf-8') as f:
    pp_code = f.read()

# Let's inspect create method in payment_plans_service
old_create_snippet = """      // Auto-generate invoices if requested
      if (dto.autoGenerateInvoices !== false) {
        await this.generateInvoices(tenantId, plan.id, customerId, dto.components, tx);
      }

      return plan;"""

new_create_snippet = """      // Auto-generate invoices if requested
      if (dto.autoGenerateInvoices !== false) {
        await this.generateInvoices(tenantId, plan.id, customerId, dto.components, tx);
      }

      // Check if plan has preliminary components (Booking / Confirmation / Half-Yearly)
      const hasPreliminary = dto.components.some(
        (c) =>
          c.type === PlanComponentType.BOOKING ||
          c.type === PlanComponentType.CONFIRMATION ||
          c.type === PlanComponentType.HALF_YEARLY,
      );

      // If preliminary components exist, ensure property status is RESERVED
      if (hasPreliminary) {
        await tx.property.update({
          where: { id: dto.propertyId },
          data: { status: 'RESERVED' },
        });
      }

      return plan;"""

# Let's inspect checkAndGenerateInstallments in payment_plans_service
old_check_snippet = """  /**
   * Check if preliminary milestone invoices (BOOKING and Confirmation/HALF_YEARLY) are PAID,
   * and if so, generate the remaining installment invoices for the property payment plan.
   */
  async checkAndGenerateInstallments(tenantId: string, propertyId: string, txParam?: any): Promise<any[]> {
    const db = txParam || this.prisma;

    // 1. Find the active payment plan for this property
    const plan = await db.paymentPlan.findFirst({
      where: { tenantId, propertyId },
      orderBy: { createdAt: 'desc' },
      include: {
        installments: {
          orderBy: { seq: 'asc' },
          include: { invoice: true },
        },
      },
    });

    if (!plan) return [];

    // 2. Find ungenerated installments (installments without an invoice)
    const ungenerated = plan.installments.filter((inst: any) => !inst.invoice);
    if (ungenerated.length === 0) {
      return []; // All installments already have invoices
    }

    // 3. Find prerequisite invoices for this property (BOOKING and CONFIRMATION / HALF_YEARLY)
    const prereqInvoices = await db.invoice.findMany({
      where: {
        tenantId,
        propertyId,
        type: { in: [InvoiceType.BOOKING, InvoiceType.CONFIRMATION, InvoiceType.HALF_YEARLY] },
      },
    });

    // If there are prerequisite invoices, ALL of them must be PAID.
    // If there are none, prerequisites are considered satisfied.
    const allPrereqsPaid = prereqInvoices.length > 0
      ? prereqInvoices.every((inv: any) => inv.status === 'PAID')
      : true;

    if (!allPrereqsPaid) {
      return [];
    }

    // 4. Prerequisites are satisfied! Get current owner customerId"""

new_check_snippet = """  /**
   * Check if preliminary milestone invoices (BOOKING and Confirmation/HALF_YEARLY) are PAID,
   * and if so, update property status to SOLD and generate the remaining installment invoices for the property payment plan.
   */
  async checkAndGenerateInstallments(tenantId: string, propertyId: string, txParam?: any): Promise<any[]> {
    const db = txParam || this.prisma;

    // 1. Find prerequisite invoices for this property (BOOKING and CONFIRMATION / HALF_YEARLY)
    const prereqInvoices = await db.invoice.findMany({
      where: {
        tenantId,
        propertyId,
        type: { in: [InvoiceType.BOOKING, InvoiceType.CONFIRMATION, InvoiceType.HALF_YEARLY] },
        status: { not: 'VOID' },
      },
    });

    // If there are prerequisite invoices, ALL of them must be PAID.
    // If there are none, prerequisites are considered satisfied.
    const hasPrereqs = prereqInvoices.length > 0;
    const allPrereqsPaid = hasPrereqs
      ? prereqInvoices.every((inv: any) => inv.status === 'PAID')
      : true;

    // If prerequisite invoices exist and NOT all are paid:
    // Property status MUST be RESERVED (not SOLD)
    if (hasPrereqs && !allPrereqsPaid) {
      const prop = await db.property.findUnique({
        where: { id: propertyId },
        select: { status: true },
      });
      if (prop && prop.status !== 'RESERVED' && prop.status !== 'CANCELLED' && prop.status !== 'IN_TRANSFER') {
        await db.property.update({
          where: { id: propertyId },
          data: { status: 'RESERVED' },
        });
      }
      return []; // Do not generate installments yet
    }

    // Both booking and confirmation (and any preliminary components) are PAID!
    // Update property status to SOLD
    const currentProp = await db.property.findUnique({
      where: { id: propertyId },
      select: { status: true },
    });
    if (currentProp && currentProp.status !== 'SOLD' && currentProp.status !== 'CANCELLED' && currentProp.status !== 'IN_TRANSFER') {
      await db.property.update({
        where: { id: propertyId },
        data: { status: 'SOLD' },
      });
    }

    // 2. Find the active payment plan for this property
    const plan = await db.paymentPlan.findFirst({
      where: { tenantId, propertyId },
      orderBy: { createdAt: 'desc' },
      include: {
        installments: {
          orderBy: { seq: 'asc' },
          include: { invoice: true },
        },
      },
    });

    if (!plan) return [];

    // 3. Find ungenerated installments (installments without an invoice)
    const ungenerated = plan.installments.filter((inst: any) => !inst.invoice);
    if (ungenerated.length === 0) {
      return []; // All installments already have invoices
    }

    // 4. Prerequisites are satisfied! Get current owner customerId"""

update_file(payment_plans_service_path, [
    (old_create_snippet, new_create_snippet),
    (old_check_snippet, new_check_snippet),
])

# 2. Update recovery.service.ts
recovery_service_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/recovery/recovery.service.ts"
update_file(recovery_service_path, [
    ("status: { in: ['BOOKED', 'SOLD'] }, // Only allocate to booked/sold properties",
     "status: { in: ['RESERVED', 'BOOKED', 'SOLD'] }, // Only allocate to booked/sold/reserved properties")
])

# 3. Update dashboard.service.ts occupancy rate
dashboard_service_path = "/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/dashboard/dashboard.service.ts"
update_file(dashboard_service_path, [
    ("occupancyRate: totalProperties > 0 ? Math.round(((propertyStatus.SOLD || 0) / totalProperties) * 100) : 0,",
     "occupancyRate: totalProperties > 0 ? Math.round((((propertyStatus.SOLD || 0) + (propertyStatus.RESERVED || 0)) / totalProperties) * 100) : 0,")
])

print("Done updating services in test directory!")
