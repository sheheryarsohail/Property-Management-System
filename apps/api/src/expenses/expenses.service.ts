import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, ListExpensesQuery } from '../dto/expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  create(tenantId: string, body: CreateExpenseDto) {
    const title =
      body.title ||
      (body.subcategory
        ? `${body.category || 'Office'} - ${body.subcategory}`
        : `${body.category || 'Office'} (${(body.type || 'EXPENSE').replace(/_/g, ' ')})`);

    let category: any = 'OFFICE';
    if (body.category) {
      const upperCat = body.category.toUpperCase();
      if (upperCat === 'DEVELOPMENT') category = 'DEVELOPMENT';
      else category = 'OFFICE';
    }

    let type: any = 'PURCHASE_INVOICE';
    if (body.type) {
      const upperType = body.type.toUpperCase();
      if (['PURCHASE_INVOICE', 'PETTY_CASH', 'ADVANCE_TO_VENDOR'].includes(upperType)) {
        type = upperType;
      }
    }

    return this.prisma.expense.create({
      data: {
        tenantId,
        title,
        incurredAt: new Date(body.date),
        type,
        category,
        subcategory: body.subcategory ?? null,
        vendorName: body.vendor ?? null,
        billNumber: body.billNo ?? null,
        amount: body.amount,
        tax: body.tax != null ? body.tax : null,
        netAmount: body.net != null ? body.net : null,
        costCenter: body.costCenter ?? null,
        project: body.project ?? null,
        notes: body.notes ?? null,
      },
    });
  }

  async list(tenantId: string, q: ListExpensesQuery) {
    const where: any = { tenantId };
    if (q.type) where.type = q.type as any;
    if (q.from || q.to) {
      where.incurredAt = {};
      if (q.from) where.incurredAt.gte = new Date(q.from);
      if (q.to) where.incurredAt.lte = new Date(q.to);
    }
    if (q.category && q.category !== 'all') {
      const upper = q.category.toUpperCase();
      if (upper === 'DEVELOPMENT' || upper === 'OFFICE') {
        where.category = upper;
      }
    }
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { subcategory: { contains: q.search, mode: 'insensitive' } },
        { vendorName: { contains: q.search, mode: 'insensitive' } },
        { billNumber: { contains: q.search, mode: 'insensitive' } },
        { notes: { contains: q.search, mode: 'insensitive' } },
      ];
    }
    const expenses = await this.prisma.expense.findMany({
      where,
      orderBy: { incurredAt: 'desc' },
    });
    
    return expenses.map(e => ({
      id: e.id,
      date: e.incurredAt,
      type: e.type,
      category: e.category,
      title: e.title,
      subcategory: e.subcategory,
      vendor: e.vendorName,
      billNo: e.billNumber,
      amount: Number(e.amount),
      notes: e.notes
    }));
  }

  async findOne(tenantId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId },
      include: {
        property: true,
        pool: true,
      },
    });

    if (!expense) return null;

    return {
      ...expense,
      date: expense.incurredAt,
      vendor: expense.vendorName,
      billNo: expense.billNumber,
      amount: Number(expense.amount),
      tax: expense.tax != null ? Number(expense.tax) : null,
      netAmount: expense.netAmount != null ? Number(expense.netAmount) : null,
    };
  }
}
