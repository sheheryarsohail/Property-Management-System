import { Controller, Get, Post, Body, Param, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ApiKeyProtected } from "../auth/api-key.decorator";
import { MergesService } from "./merges.service";
import { PreviewMergeDto } from "./dto/preview-merge.dto";
import { ExecuteMergeDto } from "./dto/execute-merge.dto";

@ApiKeyProtected()
@Controller("merges")
export class MergesController {
  constructor(private readonly mergesService: MergesService) {}

  @Get("candidates")
  async getCandidates(
    @Req() req: FastifyRequest,
    @Query("q") q?: string
  ) {
    const tenantId = (req.headers["x-tenant-id"] as string) || process.env.DEFAULT_TENANT_ID || "t_local";
    return this.mergesService.getCandidates(tenantId, q);
  }

  @Post("preview")
  async previewMerge(
    @Req() req: FastifyRequest,
    @Body() body: PreviewMergeDto
  ) {
    const tenantId = (req.headers["x-tenant-id"] as string) || process.env.DEFAULT_TENANT_ID || "t_local";
    return this.mergesService.previewMerge(tenantId, body);
  }

  @Post("execute")
  async executeMerge(
    @Req() req: FastifyRequest,
    @Body() body: ExecuteMergeDto
  ) {
    const tenantId = (req.headers["x-tenant-id"] as string) || process.env.DEFAULT_TENANT_ID || "t_local";
    const user = (req as any).user;
    return this.mergesService.executeMerge(tenantId, body, user);
  }

  @Get("history")
  async listHistory(
    @Req() req: FastifyRequest,
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const tenantId = (req.headers["x-tenant-id"] as string) || process.env.DEFAULT_TENANT_ID || "t_local";
    return this.mergesService.listHistory(tenantId, {
      q,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
    });
  }

  @Get(":id")
  async getMerge(
    @Req() req: FastifyRequest,
    @Param("id") id: string
  ) {
    const tenantId = (req.headers["x-tenant-id"] as string) || process.env.DEFAULT_TENANT_ID || "t_local";
    return this.mergesService.getMerge(tenantId, id);
  }
}
