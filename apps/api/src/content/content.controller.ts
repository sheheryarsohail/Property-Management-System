import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ContentService } from './content.service';
import { ApiKeyProtected } from '../auth/api-key.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('content')
export class ContentController {
  constructor(private readonly svc: ContentService) {}

  // ==========================================
  // PUBLIC ENDPOINTS FOR HOMEPAGE
  // ==========================================

  @Public()
  @Get('public/announcements')
  getPublicAnnouncements(@Req() req: FastifyRequest) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.getPublicAnnouncements(tenantId);
  }

  @Public()
  @Get('public/blogs')
  getPublicBlogs(@Req() req: FastifyRequest, @Query('category') category?: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.getPublicBlogs(tenantId, category);
  }

  @Public()
  @Get('public/blogs/:slug')
  getPublicBlogBySlug(@Req() req: FastifyRequest, @Param('slug') slug: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.getPublicBlogBySlug(tenantId, slug);
  }

  // ==========================================
  // ADMIN MANAGEMENT (SUPER ADMIN & ADMIN)
  // ==========================================

  @ApiKeyProtected()
  @Get('announcements')
  listAnnouncements(@Req() req: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.listAnnouncements(tenantId);
  }

  @ApiKeyProtected()
  @Get('announcements/:id')
  getAnnouncement(@Req() req: any, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.getAnnouncement(tenantId, id);
  }

  @ApiKeyProtected()
  @Post('announcements')
  createAnnouncement(@Req() req: any, @Body() body: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    const authorId = req.user?.id;
    return this.svc.createAnnouncement(tenantId, authorId, body);
  }

  @ApiKeyProtected()
  @Put('announcements/:id')
  updateAnnouncement(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.updateAnnouncement(tenantId, id, body);
  }

  @ApiKeyProtected()
  @Delete('announcements/:id')
  deleteAnnouncement(@Req() req: any, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.deleteAnnouncement(tenantId, id);
  }

  @ApiKeyProtected()
  @Get('blogs')
  listBlogs(@Req() req: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.listBlogs(tenantId);
  }

  @ApiKeyProtected()
  @Get('blogs/:id')
  getBlog(@Req() req: any, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.getBlog(tenantId, id);
  }

  @ApiKeyProtected()
  @Post('blogs')
  createBlog(@Req() req: any, @Body() body: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    const authorId = req.user?.id;
    return this.svc.createBlog(tenantId, authorId, body);
  }

  @ApiKeyProtected()
  @Put('blogs/:id')
  updateBlog(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.updateBlog(tenantId, id, body);
  }

  @ApiKeyProtected()
  @Delete('blogs/:id')
  deleteBlog(@Req() req: any, @Param('id') id: string) {
    const tenantId = (req.headers['x-tenant-id'] as string) || process.env.DEFAULT_TENANT_ID || 't_local';
    return this.svc.deleteBlog(tenantId, id);
  }
}
