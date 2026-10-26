import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { ApiKeyProtected } from "../auth/api-key.decorator";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";

@ApiKeyProtected()
@UseGuards(OptionalJwtAuthGuard)
@Controller("tenants")
export class TenantsController {
  constructor(private readonly svc: TenantsService) {}

  @Get()
  list(@Request() req: any) {
    return this.svc.list(req?.user);
  }

  @Post()
  create(@Body() body: { name: string }, @Request() req: any) {
    if (req?.user && req.user.role !== "SUPER_ADMIN") {
      throw new ForbiddenException("Only SUPER_ADMIN can create new properties");
    }
    return this.svc.create(body.name);
  }
}
