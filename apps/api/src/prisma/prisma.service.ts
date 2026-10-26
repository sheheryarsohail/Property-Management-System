import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

type AuthCtx = { tenantId: string; userId: string } | undefined;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  public requestAuth?: AuthCtx;

  private readonly enforceTenantIsolation = true;

  private readonly tenantSkipModels = new Set<string>([
    'IdempotencyKey',
  ]);

  private _idempKey?: string;
  setIdempotencyKey(v?: string) { this._idempKey = v; }
  getIdempotencyKey(): string | undefined { return this._idempKey; }

  async withIdempotencyKey<T>(key: string | undefined, fn: () => Promise<T>): Promise<T> {
    const prev = this._idempKey;
    this._idempKey = key;
    try {
      return await fn();
    } finally {
      this._idempKey = prev;
    }
  }

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
        // { emit: 'event', level: 'query' }, // enable if you want query events
      ],
    });

    // If you enabled query events above:
    // this.$on('query', (e) => { /* console.debug('[prisma] query', e); */ });
  }

  async onModuleInit() {
    await this.$connect();

    // Type-safe middleware: use Prisma.Middleware (no MiddlewareNext in 5.22)
    this.$use(async (params: Prisma.MiddlewareParams, next) => {
      const auth = this.requestAuth;
      const { action, model } = params;

      if (model === 'IdempotencyKey') {
        return next(params);
      }

      const stampBase =
        auth?.tenantId ? { tenantId: auth.tenantId } : {};

      const addStamp = (data: unknown, includeCreated: boolean) => ({
        ...(data as Record<string, unknown> ?? {}),
        ...stampBase,
      });

      if (!params.args) params.args = {};

      switch (action) {
        case 'create':
          params.args.data = addStamp(params.args.data, true);
          break;
        case 'createMany': {
          const rows = Array.isArray(params.args.data)
            ? params.args.data
            : [params.args.data];
          params.args.data = rows.map((d: unknown) => addStamp(d, true));
          break;
        }
        case 'update':
          params.args.data = addStamp(params.args.data, false);
          break;
        case 'upsert':
          if (params.args.update) params.args.update = addStamp(params.args.update, false);
          if (params.args.create) params.args.create = addStamp(params.args.create, true);
          break;
        case 'updateMany':
          params.args.data = addStamp(params.args.data, false);
          break;
        default:
          break;
      }

      // Tenant isolation
      if (this.enforceTenantIsolation && auth && model && !this.tenantSkipModels.has(model)) {
        const safeToAndTenant = new Set<string>([
          'findFirst',
          'findMany',
          'count',
          'aggregate',
          'groupBy',
          'updateMany',
          'deleteMany',
        ]);

        if (safeToAndTenant.has(action)) {
          const existingWhere = params.args.where ?? {};
          params.args.where = { AND: [existingWhere, { tenantId: auth.tenantId }] };
        }
      }

      return next(params);
    });
  }

  // Use process.on to avoid the '$on("beforeExit")' typing error in 5.22
  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
