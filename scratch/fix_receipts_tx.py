import os

target_path = '/home/sheheryar-sohail/Downloads/Property-Management-System-test/apps/api/src/receipts/receipts.service.ts'

with open(target_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Locate from "async create(tenantId: string, input: CreateReceiptDto) {" up to "async get(tenantId: string, id: string) {"
part_before = text.split("  async create(tenantId: string, input: CreateReceiptDto) {")[0]
part_after = "  async get(tenantId: string, id: string) {" + text.split("  async get(tenantId: string, id: string) {")[1]

clean_create_method = '''  async create(tenantId: string, input: CreateReceiptDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Determine category
      let category = input.category || 'INSTALLMENT';
      if (input.invoiceId && category !== 'DEVELOPMENT') {
        const inv = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (inv?.type === 'DEVELOPMENT_CHARGE') {
          category = 'DEVELOPMENT';
        }
      }

      let receiptCode = input.code ? input.code.trim() : '';

      // 2. Receipt Code Generation with Differentiator (auto & manual)
      if (category === 'DEVELOPMENT') {
        if (receiptCode) {
          // User entered a manual code for dev receipt (e.g. "1052" or "DEV-1052")
          // Enforce differentiator prefix "DEV-" so manual dev receipt never collides with installment receipt
          const rawCode = receiptCode.replace(/^DEV-?(REC-?)?/i, '').trim();
          receiptCode = `DEV-${rawCode}`;
        } else {
          // Auto-generate DEV-REC-X (ensure no collision)
          const devCount = await tx.receipt.count({
            where: {
              tenantId,
              OR: [
                { category: 'DEVELOPMENT' },
                { code: { startsWith: 'DEV-' } },
              ],
            },
          });
          let seq = devCount + 1;
          while (await tx.receipt.findUnique({ where: { tenantId_code: { tenantId, code: `DEV-REC-${seq}` } } })) {
            seq++;
          }
          receiptCode = `DEV-REC-${seq}`;
        }
      } else {
        if (!receiptCode) {
          const count = await tx.receipt.count({
            where: {
              tenantId,
              NOT: { code: { startsWith: 'DEV-' } },
            },
          });
          let seq = count + 1;
          while (await tx.receipt.findUnique({ where: { tenantId_code: { tenantId, code: `REC-${seq}` } } })) {
            seq++;
          }
          receiptCode = `REC-${seq}`;
        }
      }

      const existing = await tx.receipt.findUnique({
        where: { tenantId_code: { tenantId, code: receiptCode } },
      });
      if (existing) {
        if (existing.status === 'VOID') {
          throw new BadRequestException(`Receipt number ${receiptCode} was VOIDED and cannot be reused.`);
        }
        throw new BadRequestException(`Receipt number ${receiptCode} already exists.`);
      }

      let propertyId: string | null = input.propertyId || null;
      if (!propertyId && input.invoiceId) {
        const invoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (invoice?.propertyId) {
          propertyId = invoice.propertyId;
        }
      }

      const receipt = await tx.receipt.create({
        data: {
          tenantId,
          code: receiptCode,
          category,
          invoiceId: input.invoiceId,
          customerId: input.customerId,
          propertyId,
          amount: input.amount,
          method: input.method,
          reference: input.reference,
          notes: input.notes,
          receivedAt: input.receivedAt ?? new Date(),
          bankName: input.bankName,
          chequeNumber: input.chequeNumber,
          chequeDate: input.chequeDate,
          slipNumber: input.slipNumber,
        },
      });

      let remainingAmount = Number(input.amount);
      const allocations: Array<{ invoiceId: string; invoiceCode: string; amount: number }> = [];

      // 1. Target specific invoice if provided
      if (input.invoiceId) {
        const targetInvoice = await tx.invoice.findUnique({ where: { id: input.invoiceId } });
        if (targetInvoice) {
          if (targetInvoice.status === 'VOID') {
            throw new BadRequestException(`Cannot apply payment to a VOID invoice (${targetInvoice.code})`);
          }
          const targetBalance = Number(targetInvoice.total) - Number(targetInvoice.paid);
          if (targetBalance > 0) {
            const allocate = Math.min(remainingAmount, targetBalance);
            remainingAmount -= allocate;
            const newPaid = Number(targetInvoice.paid) + allocate;
            const isPaid = newPaid >= Number(targetInvoice.total);
            
            allocations.push({ invoiceId: targetInvoice.id, invoiceCode: targetInvoice.code, amount: allocate });

            await tx.invoice.update({
              where: { id: targetInvoice.id },
              data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
            });
          }
        }
      }

      // 2. Waterfall auto-allocate any remaining surplus to other unpaid invoices for the same property
      if (remainingAmount > 0 && propertyId) {
        const invoiceTypeFilter = category === 'DEVELOPMENT'
          ? { type: 'DEVELOPMENT_CHARGE' as const }
          : { type: { not: 'DEVELOPMENT_CHARGE' as const } };

        const unpaidInvoices = await tx.invoice.findMany({
          where: {
            tenantId,
            propertyId,
            ...invoiceTypeFilter,
            status: { in: ['PENDING', 'PARTIAL'] },
          },
          orderBy: { dueDate: 'asc' }, // Oldest first
        });

        for (const inv of unpaidInvoices) {
          if (remainingAmount <= 0) break;
          if (inv.id === input.invoiceId) continue; // Already processed above

          const balance = Number(inv.total) - Number(inv.paid);
          if (balance > 0) {
            const allocate = Math.min(remainingAmount, balance);
            remainingAmount -= allocate;
            const newPaid = Number(inv.paid) + allocate;
            const isPaid = newPaid >= Number(inv.total);
            
            allocations.push({ invoiceId: inv.id, invoiceCode: inv.code, amount: allocate });

            await tx.invoice.update({
              where: { id: inv.id },
              data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
            });
          }
        }
      }

      // 3. If preliminary invoices (Booking / Confirmation) are now paid, generate any pending installments!
      if (propertyId && category !== 'DEVELOPMENT') {
        const generatedInvoices = await this.paymentPlansService.checkAndGenerateInstallments(tenantId, propertyId, tx);

        // If new installment invoices were generated and there is surplus cash, waterfall into them
        if (generatedInvoices.length > 0 && remainingAmount > 0) {
          for (const inv of generatedInvoices) {
            if (remainingAmount <= 0) break;

            const balance = Number(inv.total) - Number(inv.paid);
            if (balance > 0) {
              const allocate = Math.min(remainingAmount, balance);
              remainingAmount -= allocate;
              const newPaid = Number(inv.paid) + allocate;
              const isPaid = newPaid >= Number(inv.total);

              allocations.push({ invoiceId: inv.id, invoiceCode: inv.code, amount: allocate });

              await tx.invoice.update({
                where: { id: inv.id },
                data: { paid: newPaid, status: isPaid ? 'PAID' : 'PARTIAL' },
              });
            }
          }
        }
      }

      if (allocations.length > 0) {
        await tx.receipt.update({
          where: { id: receipt.id },
          data: { allocations },
        });
        (receipt as any).allocations = allocations;
      }

      return receipt;
    });
  }

'''

final_text = part_before + clean_create_method + part_after
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(final_text)

print("SUCCESS: Perfectly wrote clean transactional create method in receipts.service.ts")
