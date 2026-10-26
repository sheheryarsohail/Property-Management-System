import { Body, Controller, Get, Param, Post, Put, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { DevelopmentChargesService } from "./development-charges.service";
import { ApiKeyProtected } from "../auth/api-key.decorator";
import { TenantId } from "../common/decorators/tenant-id.decorator";

@ApiKeyProtected()
@Controller("development-charges")
export class DevelopmentChargesController {
  constructor(private readonly svc: DevelopmentChargesService) {}

  @Get("properties")
  getProperties(
    @TenantId() tenantId: string,
    @Query("search") search?: string,
    @Query("phase") phase?: number,
  ) {
    return this.svc.getProperties(tenantId, search, phase ? Number(phase) : 1);
  }

  @Put("properties/:id")
  setPropertyCharge(
    @TenantId() tenantId: string,
    @Param("id") id: string,
    @Body() body: { amount: number; dueDate?: string; phase?: number },
  ) {
    return this.svc.setPropertyCharge(tenantId, id, body);
  }

  @Post("bulk-set")
  bulkSetCharges(
    @TenantId() tenantId: string,
    @Body() body: { propertyIds: string[]; amount: number; dueDate?: string },
  ) {
    return this.svc.bulkSetCharges(tenantId, body);
  }

  @Get("invoices")
  getInvoices(
    @TenantId() tenantId: string,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.svc.getInvoices(tenantId, { status, search, page, limit });
  }

  @Post("generate")
  generate(
    @TenantId() tenantId: string,
    @Body() body: { pricePerSqYd: number; title: string; dueDate: string },
  ) {
    return this.svc.generateCharges(tenantId, {
      ...body,
      dueDate: new Date(body.dueDate),
    });
  }
}
