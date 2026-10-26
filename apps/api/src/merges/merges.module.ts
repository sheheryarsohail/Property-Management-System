import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PaymentPlansModule } from "../payment-plans/payment-plans.module";
import { MergesController } from "./merges.controller";
import { MergesService } from "./merges.service";

@Module({
  imports: [PrismaModule, PaymentPlansModule],
  controllers: [MergesController],
  providers: [MergesService],
  exports: [MergesService],
})
export class MergesModule {}
