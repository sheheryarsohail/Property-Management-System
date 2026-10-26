import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { ApiKeyGuard } from './common/guards/api-key.guard';

import { AuthModule } from './auth/auth.module';
import { ApiKeyService } from './auth/api-key.service';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

import { CustomersModule } from './customers/customers.module';
import { PropertiesModule } from './properties/properties.module';
import { OwnershipsModule } from './ownerships/ownerships.module';
import { TransfersModule } from './transfers/transfers.module';
import { CancellationsModule } from './cancellations/cancellations.module';
import { MergesModule } from './merges/merges.module';
import { PaymentPlansModule } from './payment-plans/payment-plans.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { DevelopmentChargesModule } from './development-charges/development-charges.module';
import { PdcModule } from './pdc/pdc.module';
import { StatementsModule } from './statements/statements.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpensePoolsModule } from './expense-pools/expense-pools.module';
import { RecoveryModule } from './recovery/recovery.module';
import { CommunicationModule } from './communication/communication.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PortalModule } from './portal/portal.module';
import { ContentModule } from './content/content.module';
import { TenantsModule } from './tenants/tenants.module';

import { StorageModule } from './storage/storage.module';
import { ObservabilityModule } from './observability/observability.module';
import { HealthModule } from './health/health.module';

import { PdfModule } from './pdf/pdf.module';
import { PdfQueueModule } from './queue/pdf-queue.module';
import { PdfWorkerModule } from './queue/pdf-worker.module';
import { JobsModule } from './queue/jobs.module';

import { IdemModule } from './common/idem/idem.module';

import { DebugController } from './debug/debug.controller';
import { PdfStatusController } from './queue/pdf-status.controller';

@Module({
  imports: [
    // globals / core
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env', '../apps/api/.env', '../../.env'],
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
    PrismaModule,

    // domain
    CustomersModule,
    PropertiesModule,
    OwnershipsModule,
    TransfersModule,
    CancellationsModule,
    MergesModule,
    PaymentPlansModule,
    InvoicesModule,
    ReceiptsModule,
    DevelopmentChargesModule,
    PdcModule,
    StatementsModule,
    ExpensesModule,
    ExpensePoolsModule,
    RecoveryModule,
    CommunicationModule,
    ReportsModule,
    DashboardModule,
    PortalModule,
    ContentModule,

    // infra / cross-cutting
    StorageModule,
    ObservabilityModule,
    HealthModule,
    IdemModule,

    // pdf / queue (each exactly once)
    PdfModule,
    PdfQueueModule,
    PdfWorkerModule,
    JobsModule,
  ],
  controllers: [
    AppController,
    PdfStatusController,
    DebugController, // include explicitly so it’s registered once
  ],
  providers: [
    ApiKeyService,
    { provide: APP_GUARD, useClass: ApiKeyGuard },
  ],
})
export class AppModule {}

// ✅ remove the stray export array — it isn't used by Nest and can confuse things
