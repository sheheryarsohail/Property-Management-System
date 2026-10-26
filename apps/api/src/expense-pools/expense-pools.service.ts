import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AllocatePoolDto,
  AttachExpensesDto,
  CreateExpensePoolDto,
  GenerateRecoveryDto,
} from '../dto/expense-pools.dto';

type ExpenseWithAmount = { expense: { amount: unknown } };
type PropLite = { id: string; sizeYd2: number | string | null };

const toNum = (v: unknown): number => (v == null ? 0 : Number(v));

@Injectable()
export class ExpensePoolsService {
  constructor(private prisma: PrismaService) {}

  async create(body: CreateExpensePoolDto) {
    const from = new Date(body.fromDate);
    const to = new Date(body.toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
      throw new BadRequestException('Invalid date range');
    }
    return this.prisma.expensePool.create({
      data: {
        title: body.title,
        fromDate: from,
        toDate: to,
        scopeBlock: body.scopeBlock ?? null,
        method: body.method,
        status: 'Draft',
        notes: body.notes ?? null,
      },
    });
  }

  get(id: string) {
    return this.prisma.expensePool.findUnique({
      where: { id },
      include: {
        items: { include: { expense: true } },
        allocations: true,
      },
    });
  }

  /** Link expenses into pool by filters (type default Development + date range + optional block via costCenter/project) */
  async attachExpenses(id: string, q: AttachExpensesDto) {
    const pool = await this.prisma.expensePool.findUnique({ where: { id } });
    if (!pool) throw new NotFoundException('Pool not found');

    const where: any = {
      type: q.type ?? 'Development',
      date: { gte: new Date(pool.fromDate), lte: new Date(pool.toDate) },
    };
    if (pool.scopeBlock || q.scopeBlock) where.costCenter = pool?.scopeBlock ?? q.scopeBlock;

    const exps: Array<{ id: string }> = await this.prisma.expense.findMany({
      where,
      select: { id: true },
    });
    if (exps.length === 0) return { added: 0 };

    const values = exps.map((e) => ({ poolId: id, expenseId: e.id }));
    const res = await this.prisma.expensePoolItem.createMany({
      data: values,
      skipDuplicates: true,
    });
    return { added: res.count };
  }

  /**
   * Allocate pool total to properties:
   * - Equal: each eligible property = total / count
   * - BySize: proportional to sizeYd2
   * - Fixed: use provided fixedMap (propertyId -> amount); must sum to total
   */
  async allocate(id: string, body: AllocatePoolDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const pool = await tx.expensePool.findUnique({
        where: { id },
        include: { items: { include: { expense: true } } },
      });
      if (!pool) throw new NotFoundException('Pool not found');

      const total = pool.items.reduce(
        (s: number, it: ExpenseWithAmount) => s + Number((it.expense as any).amount),
        0,
      );
      if (total <= 0) throw new BadRequestException('Pool has no amount to allocate');

      // candidate properties
      const props: PropLite[] = await tx.property.findMany({
        where: pool.scopeBlock ? { block: pool.scopeBlock } : {},
        select: { id: true, sizeYd2: true },
      });
      if (props.length === 0) throw new BadRequestException('No properties found for allocation scope');

      // clear old allocations for this pool (re-run friendly)
      await tx.expenseAllocation.deleteMany({ where: { poolId: id } });

      if (pool.method === 'Fixed') {
        const map = body.fixedMap ?? {};
        const ids = Object.keys(map);
        if (ids.length === 0) throw new BadRequestException('fixedMap required for Fixed method');

        const set = new Set(props.map((p) => p.id));
        for (const pid of ids) {
          if (!set.has(pid)) throw new BadRequestException(`propertyId not in scope: ${pid}`);
          if (Number(map[pid]) < 0) throw new BadRequestException(`negative amount for ${pid}`);
        }
        const sum = ids.reduce((s: number, pid: string) => s + Number(map[pid]), 0);
        if (Math.abs(sum - total) > 0.01) {
          throw new BadRequestException('fixedMap amounts must sum to pool total');
        }

        for (const pid of ids) {
          await tx.expenseAllocation.create({
            data: {
              poolId: id,
              propertyId: pid,
              basis: 'Fixed',
              shareBasis: null,
              amount: Number(map[pid]),
            },
          });
        }
      } else if (pool.method === 'Equal') {
        const each = total / props.length;
        for (const p of props) {
          await tx.expenseAllocation.create({
            data: {
              poolId: id,
              propertyId: p.id,
              basis: 'Equal',
              shareBasis: 1,
              amount: each,
            },
          });
        }
      } else if (pool.method === 'BySize') {
        const sumSize = props.reduce((s: number, p: PropLite) => s + toNum(p.sizeYd2), 0);
        if (sumSize <= 0) throw new BadRequestException('Total size is zero');
        for (const p of props) {
          const share = toNum(p.sizeYd2) / sumSize;
          const amt = total * share;
          await tx.expenseAllocation.create({
            data: {
              poolId: id,
              propertyId: p.id,
              basis: 'Size',
              shareBasis: toNum(p.sizeYd2),
              amount: amt,
            },
          });
        }
      } else {
        throw new BadRequestException('Unknown method');
      }

      await tx.expensePool.update({ where: { id }, data: { status: 'Allocated' } });

      const allocations = await tx.expenseAllocation.findMany({ where: { poolId: id } });
      const allocatedTotal = allocations.reduce(
        (s: number, a: { amount: unknown }) => s + Number(a.amount),
        0,
      );
      return { poolId: id, total, allocated: allocatedTotal, count: allocations.length };
    });
  }

  /**
   * Generate Development Charge invoices from allocations.
   * Creates Draft invoices (type "DevCharge").
   */
  async generateRecovery(id: string, body: GenerateRecoveryDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const pool = await tx.expensePool.findUnique({
        where: { id },
        include: { allocations: true },
      });
      if (!pool) throw new NotFoundException('Pool not found');
      if (pool.allocations.length === 0) {
        throw new BadRequestException('No allocations found. Run allocation first.');
      }

      const issue = body.issueDate ? new Date(body.issueDate) : new Date();
      const due = body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 10 * 86400000);

      for (const a of pool.allocations) {
        const owner = await tx.ownership.findFirst({
          where: { propertyId: a.propertyId, status: 'Active' },
          select: { customerId: true },
        });
        if (!owner) continue;

        const last = await tx.invoice.findFirst({
          where: { propertyId: a.propertyId },
          orderBy: { seq: 'desc' },
          select: { seq: true },
        });
        const nextSeq = (last?.seq ?? 0) + 1;

        await tx.invoice.create({
          data: {
            seq: nextSeq,
            type: 'DevCharge',
            amount: a.amount as any, // number | decimal accepted by Prisma
            issueDate: issue,
            dueDate: due,
            status: 'Draft',
            notes: body.notes ?? `Recovery from pool: ${pool.title}`,
            customerId: owner.customerId,
            propertyId: a.propertyId,
          },
        });
      }

      await tx.expensePool.update({ where: { id }, data: { status: 'Recovered' } });
      return { ok: true };
    });
  }
}
