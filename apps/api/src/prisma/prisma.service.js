"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    requestAuth;
    enforceTenantIsolation = true;
    tenantSkipModels = new Set([]);
    _idempKey;
    setIdempotencyKey(v) { this._idempKey = v; }
    getIdempotencyKey() { return this._idempKey; }
    async withIdempotencyKey(key, fn) {
        const prev = this._idempKey;
        this._idempKey = key;
        try {
            return await fn();
        }
        finally {
            this._idempKey = prev;
        }
    }
    constructor() {
        super({
            log: [
                { emit: 'stdout', level: 'warn' },
                { emit: 'stdout', level: 'error' },
            ],
        });
    }
    async onModuleInit() {
        await this.$connect();
        this.$use(async (params, next) => {
            const auth = this.requestAuth;
            const { action, model } = params;
            const stampBase = auth ? { updatedBy: auth.userId, tenantId: auth.tenantId } : {};
            const addStamp = (data, includeCreated) => ({
                ...(data ?? {}),
                ...stampBase,
                ...(includeCreated && auth ? { createdBy: auth.userId } : {}),
            });
            if (!params.args)
                params.args = {};
            switch (action) {
                case 'create':
                    params.args.data = addStamp(params.args.data, true);
                    break;
                case 'createMany': {
                    const rows = Array.isArray(params.args.data) ? params.args.data : [params.args.data];
                    params.args.data = rows.map((d) => addStamp(d, true));
                    break;
                }
                case 'update':
                    params.args.data = addStamp(params.args.data, false);
                    break;
                case 'upsert':
                    params.args.data = addStamp(params.args.data, false);
                    if (params.args.create)
                        params.args.create = addStamp(params.args.create, true);
                    break;
                case 'updateMany':
                    params.args.data = addStamp(params.args.data, false);
                    break;
                default:
                    break;
            }
            if (this.enforceTenantIsolation && auth && model && !this.tenantSkipModels.has(model)) {
                const safeToAndTenant = new Set([
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
    async enableShutdownHooks(app) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
