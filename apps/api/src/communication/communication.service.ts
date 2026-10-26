import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { CommChannel } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../queue/redis.config';

@Injectable()
export class CommunicationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommunicationService.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
  ) {}

  async onModuleInit() {
    try {
      const connection = redisConnection();
      const QUEUE_NAME = 'communication_reminders';
      this.queue = new Queue(QUEUE_NAME, { connection });
      this.worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          const { type, tenantId, channel, options } = job.data;
          if (type === 'due') {
            return this.processDueInvoiceReminders(tenantId, channel, options);
          } else if (type === 'overdue') {
            return this.processOverdueInvoiceReminders(tenantId, channel, options);
          } else if (type === 'pdc') {
            return this.processPdcDepositReminders(tenantId, channel, options);
          }
        },
        { connection, concurrency: 2 },
      );

      this.worker.on('completed', (job) => {
        this.logger.log(`[comm-worker] Job ${job.name} #${job.id} completed successfully`);
      });
      this.worker.on('failed', (job, err) => {
        this.logger.error(`[comm-worker] Job ${job?.name} #${job?.id} failed: ${err?.message || err}`);
      });
      this.logger.log('Communication background BullMQ worker initialized');
    } catch (err: any) {
      this.logger.warn(`Could not initialize BullMQ communication worker: ${err?.message}. Direct fallback active.`);
      this.queue = null;
      this.worker = null;
    }
  }

  async onModuleDestroy() {
    await Promise.all([
      this.worker?.close().catch(() => {}),
      this.queue?.close().catch(() => {}),
    ]);
  }

  /**
   * Log a communication
   */
  async log(
    tenantId: string,
    data: {
      channel: CommChannel;
      customerId?: string;
      propertyId?: string;
      invoiceId?: string;
      subject?: string;
      body: string;
    },
  ) {
    return this.prisma.communication.create({
      data: {
        tenantId,
        channel: data.channel,
        customerId: data.customerId,
        propertyId: data.propertyId,
        invoiceId: data.invoiceId,
        subject: data.subject,
        body: data.body,
      },
      include: {
        customer: { select: { id: true, fullName: true, code: true } },
        property: { select: { id: true, code: true, title: true } },
        invoice: { select: { id: true, code: true } },
      },
    });
  }

  /**
   * Get communication history
   */
  async getHistory(
    tenantId: string,
    filters?: {
      customerId?: string;
      propertyId?: string;
      invoiceId?: string;
      channel?: CommChannel;
      from?: Date;
      to?: Date;
    },
  ) {
    return this.prisma.communication.findMany({
      where: {
        tenantId,
        customerId: filters?.customerId,
        propertyId: filters?.propertyId,
        invoiceId: filters?.invoiceId,
        channel: filters?.channel,
        ...(filters?.from || filters?.to
          ? {
              createdAt: {
                gte: filters?.from,
                lte: filters?.to,
              },
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, fullName: true, code: true, email: true, phone: true } },
        property: { select: { id: true, code: true, title: true } },
        invoice: { select: { id: true, code: true, total: true, paid: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Send reminders for due invoices (Decoupled with BullMQ queue)
   */
  async sendDueInvoiceReminders(
    tenantId: string,
    channel: CommChannel,
    options?: {
      customerIds?: string[];
      propertyIds?: string[];
      daysBeforeDue?: number;
    },
  ) {
    if (this.queue) {
      try {
        const job = await this.queue.add('due-invoices', {
          type: 'due',
          tenantId,
          channel,
          options,
        }, {
          attempts: 2,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: { age: 3600, count: 500 },
          removeOnFail: { age: 86400, count: 500 },
        });
        this.logger.log(`Queued due invoice reminders job #${job.id}`);
        return {
          success: true,
          queued: true,
          jobId: job.id,
          sent: 0,
          communications: [],
          message: 'Due invoice reminders queued for background delivery',
        };
      } catch (err: any) {
        this.logger.warn(`Failed queueing due reminders, falling back to direct execution: ${err?.message}`);
      }
    }

    return this.processDueInvoiceReminders(tenantId, channel, options);
  }

  /**
   * Internal processor for due invoice reminders
   */
  async processDueInvoiceReminders(
    tenantId: string,
    channel: CommChannel,
    options?: {
      customerIds?: string[];
      propertyIds?: string[];
      daysBeforeDue?: number;
    },
  ) {
    const daysBeforeDue = options?.daysBeforeDue || 3;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeDue);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: {
          gte: new Date(),
          lte: targetDate,
        },
        ...(options?.customerIds ? { customerId: { in: options.customerIds } } : {}),
        ...(options?.propertyIds ? { propertyId: { in: options.propertyIds } } : {}),
      },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        property: { select: { code: true, title: true } },
      },
    });

    const communications = [];

    for (const invoice of invoices) {
      const balance = Number(invoice.total) - Number(invoice.paid);
      const subject = `Payment Reminder - Invoice ${invoice.code}`;
      const body = `Dear ${invoice.customer.fullName},\n\nThis is a reminder that Invoice ${invoice.code} for ${invoice.property.code} is due on ${invoice.dueDate.toDateString()}.\n\nAmount Due: PKR ${balance.toLocaleString()}\n\nPlease make the payment at your earliest convenience.\n\nThank you.`;

      const comm = await this.log(tenantId, {
        channel,
        customerId: invoice.customerId,
        propertyId: invoice.propertyId,
        invoiceId: invoice.id,
        subject,
        body,
      });

      communications.push(comm);

      if (channel === 'EMAIL' && invoice.customer?.email) {
        try {
          await this.mailer.send({
            to: invoice.customer.email,
            subject,
            text: body,
          });
        } catch (mailErr: any) {
          this.logger.warn(`Failed sending email to ${invoice.customer.email}: ${mailErr?.message}`);
        }
      }

      this.logger.log(`[${channel}] Reminder logged for ${invoice.customer.fullName} for invoice ${invoice.code}`);
    }

    return {
      sent: communications.length,
      communications,
    };
  }

  /**
   * Send reminders for overdue invoices (Decoupled with BullMQ queue)
   */
  async sendOverdueInvoiceReminders(
    tenantId: string,
    channel: CommChannel,
    options?: {
      customerIds?: string[];
      propertyIds?: string[];
    },
  ) {
    if (this.queue) {
      try {
        const job = await this.queue.add('overdue-invoices', {
          type: 'overdue',
          tenantId,
          channel,
          options,
        }, {
          attempts: 2,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: { age: 3600, count: 500 },
          removeOnFail: { age: 86400, count: 500 },
        });
        this.logger.log(`Queued overdue reminders job #${job.id}`);
        return {
          success: true,
          queued: true,
          jobId: job.id,
          sent: 0,
          communications: [],
          message: 'Overdue invoice reminders queued for background delivery',
        };
      } catch (err: any) {
        this.logger.warn(`Failed queueing overdue reminders, falling back to direct execution: ${err?.message}`);
      }
    }

    return this.processOverdueInvoiceReminders(tenantId, channel, options);
  }

  /**
   * Internal processor for overdue invoice reminders
   */
  async processOverdueInvoiceReminders(
    tenantId: string,
    channel: CommChannel,
    options?: {
      customerIds?: string[];
      propertyIds?: string[];
    },
  ) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        dueDate: { lt: new Date() },
        ...(options?.customerIds ? { customerId: { in: options.customerIds } } : {}),
        ...(options?.propertyIds ? { propertyId: { in: options.propertyIds } } : {}),
      },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        property: { select: { code: true, title: true } },
      },
    });

    const communications = [];

    for (const invoice of invoices) {
      const balance = Number(invoice.total) - Number(invoice.paid);
      const daysOverdue = Math.floor(
        (new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      const subject = `OVERDUE Payment Notice - Invoice ${invoice.code}`;
      const body = `Dear ${invoice.customer.fullName},\n\nThis is an urgent notice that Invoice ${invoice.code} for ${invoice.property.code} is OVERDUE by ${daysOverdue} days.\n\nAmount Due: PKR ${balance.toLocaleString()}\nDue Date: ${invoice.dueDate.toDateString()}\n\nPlease make the payment immediately to avoid late fees.\n\nThank you.`;

      const comm = await this.log(tenantId, {
        channel,
        customerId: invoice.customerId,
        propertyId: invoice.propertyId,
        invoiceId: invoice.id,
        subject,
        body,
      });

      communications.push(comm);

      if (channel === 'EMAIL' && invoice.customer?.email) {
        try {
          await this.mailer.send({
            to: invoice.customer.email,
            subject,
            text: body,
          });
        } catch (mailErr: any) {
          this.logger.warn(`Failed sending email to ${invoice.customer.email}: ${mailErr?.message}`);
        }
      }

      this.logger.log(`[${channel}] Overdue reminder logged for ${invoice.customer.fullName} for invoice ${invoice.code}`);
    }

    return {
      sent: communications.length,
      communications,
    };
  }

  /**
   * Send PDC deposit reminders (Decoupled with BullMQ queue)
   */
  async sendPdcDepositReminders(
    tenantId: string,
    channel: CommChannel,
    options?: {
      customerIds?: string[];
      daysBeforeDeposit?: number;
    },
  ) {
    if (this.queue) {
      try {
        const job = await this.queue.add('pdc-deposits', {
          type: 'pdc',
          tenantId,
          channel,
          options,
        }, {
          attempts: 2,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: { age: 3600, count: 500 },
          removeOnFail: { age: 86400, count: 500 },
        });
        this.logger.log(`Queued PDC deposit reminders job #${job.id}`);
        return {
          success: true,
          queued: true,
          jobId: job.id,
          sent: 0,
          communications: [],
          message: 'PDC deposit reminders queued for background delivery',
        };
      } catch (err: any) {
        this.logger.warn(`Failed queueing PDC reminders, falling back to direct execution: ${err?.message}`);
      }
    }

    return this.processPdcDepositReminders(tenantId, channel, options);
  }

  /**
   * Internal processor for PDC deposit reminders
   */
  async processPdcDepositReminders(
    tenantId: string,
    channel: CommChannel,
    options?: {
      customerIds?: string[];
      daysBeforeDeposit?: number;
    },
  ) {
    const daysBeforeDeposit = options?.daysBeforeDeposit || 3;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeDeposit);

    const pdcs = await this.prisma.postDatedCheque.findMany({
      where: {
        tenantId,
        status: 'RECEIVED',
        dueDate: {
          gte: new Date(),
          lte: targetDate,
        },
        ...(options?.customerIds ? { customerId: { in: options.customerIds } } : {}),
      },
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    const communications = [];

    for (const pdc of pdcs) {
      const subject = `PDC Deposit Notice - Cheque ${pdc.chequeNo}`;
      const body = `Dear ${pdc.customer.fullName},\n\nThis is a notice that your post-dated cheque ${pdc.chequeNo} (${pdc.bank}) will be deposited on ${pdc.dueDate.toDateString()}.\n\nAmount: PKR ${Number(pdc.amount).toLocaleString()}\n\nPlease ensure sufficient funds are available.\n\nThank you.`;

      const comm = await this.log(tenantId, {
        channel,
        customerId: pdc.customerId,
        subject,
        body,
      });

      communications.push(comm);

      if (channel === 'EMAIL' && pdc.customer?.email) {
        try {
          await this.mailer.send({
            to: pdc.customer.email,
            subject,
            text: body,
          });
        } catch (mailErr: any) {
          this.logger.warn(`Failed sending email to ${pdc.customer.email}: ${mailErr?.message}`);
        }
      }

      this.logger.log(`[${channel}] PDC deposit reminder logged for ${pdc.customer.fullName} for cheque ${pdc.chequeNo}`);
    }

    return {
      sent: communications.length,
      communications,
    };
  }

  /**
   * Get communication statistics
   */
  async getStats(tenantId: string, from?: Date, to?: Date) {
    const where: any = { tenantId };
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [total, byChannel] = await Promise.all([
      this.prisma.communication.count({ where }),
      this.prisma.communication.groupBy({
        by: ['channel'],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byChannel: byChannel.map((item) => ({
        channel: item.channel,
        count: item._count,
      })),
    };
  }
}
