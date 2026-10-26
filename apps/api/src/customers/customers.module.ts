// src/customers/customers.module.ts
import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { PrismaModule } from '../prisma/prisma.module'; // adjust path

@Module({
  imports: [PrismaModule], // <- required if PrismaModule isn’t @Global()
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
