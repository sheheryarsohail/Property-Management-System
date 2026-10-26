import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@TenantId() tenantId: string, @Request() req: any) {
    return this.usersService.findAll(tenantId, req.user);
  }

  @Post()
  async create(@TenantId() tenantId: string, @Body() dto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(tenantId, dto, req.user);
  }

  @Put(':id')
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: any
  ) {
    return this.usersService.update(tenantId, id, dto, req.user);
  }

  @Delete(':id')
  async remove(@TenantId() tenantId: string, @Param('id') id: string, @Request() req: any) {
    return this.usersService.remove(tenantId, id, req.user);
  }
}
