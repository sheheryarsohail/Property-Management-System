import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  async getPublicAnnouncements(tenantId: string) {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        tenantId,
        isPublished: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      orderBy: [
        { publishedAt: 'desc' }
      ]
    });
  }

  async listAnnouncements(tenantId: string) {
    return this.prisma.announcement.findMany({
      where: { tenantId },
      include: {
        author: { select: { id: true, name: true, email: true } }
      },
      orderBy: { publishedAt: 'desc' }
    });
  }

  async getAnnouncement(tenantId: string, id: string) {
    const item = await this.prisma.announcement.findFirst({
      where: { tenantId, id },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });
    if (!item) throw new NotFoundException('Announcement not found');
    return item;
  }

  private parseDate(val: any): Date | null {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  async createAnnouncement(tenantId: string, authorId: string | undefined, data: any) {
    let validAuthorId: string | null = null;
    if (authorId) {
      const user = await this.prisma.user.findUnique({ where: { id: authorId }, select: { id: true } });
      if (user) validAuthorId = user.id;
    }

    const publishedAt = this.parseDate(data.publishedAt) || new Date();
    const expiresAt = this.parseDate(data.expiresAt);

    return this.prisma.announcement.create({
      data: {
        tenantId,
        authorId: validAuthorId,
        title: data.title,
        content: data.content,
        category: data.category || 'General',
        priority: data.priority || 'NORMAL',
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
        publishedAt,
        expiresAt,
      }
    });
  }

  async updateAnnouncement(tenantId: string, id: string, data: any) {
    await this.getAnnouncement(tenantId, id);
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isPublished !== undefined) updateData.isPublished = Boolean(data.isPublished);
    if (data.publishedAt !== undefined) {
      const pDate = this.parseDate(data.publishedAt);
      if (pDate) updateData.publishedAt = pDate;
    }
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = this.parseDate(data.expiresAt);
    }

    return this.prisma.announcement.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteAnnouncement(tenantId: string, id: string) {
    await this.getAnnouncement(tenantId, id);
    return this.prisma.announcement.delete({
      where: { id }
    });
  }

  // ==========================================
  // BLOG POSTS / NEWS
  // ==========================================

  async getPublicBlogs(tenantId: string, category?: string) {
    return this.prisma.blogPost.findMany({
      where: {
        tenantId,
        isPublished: true,
        ...(category ? { category } : {})
      },
      include: {
        author: { select: { name: true } }
      },
      orderBy: { publishedAt: 'desc' }
    });
  }

  async getPublicBlogBySlug(tenantId: string, slug: string) {
    const blog = await this.prisma.blogPost.findFirst({
      where: {
        tenantId,
        slug,
        isPublished: true
      },
      include: {
        author: { select: { name: true } }
      }
    });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async listBlogs(tenantId: string) {
    return this.prisma.blogPost.findMany({
      where: { tenantId },
      include: {
        author: { select: { id: true, name: true, email: true } }
      },
      orderBy: { publishedAt: 'desc' }
    });
  }

  async getBlog(tenantId: string, id: string) {
    const blog = await this.prisma.blogPost.findFirst({
      where: { tenantId, id },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'post-' + Date.now();
  }

  async createBlog(tenantId: string, authorId: string | undefined, data: any) {
    let slug = data.slug ? this.generateSlug(data.slug) : this.generateSlug(data.title);
    
    // Ensure slug uniqueness within tenant
    const existing = await this.prisma.blogPost.findFirst({
      where: { tenantId, slug }
    });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    let validAuthorId: string | null = null;
    if (authorId) {
      const user = await this.prisma.user.findUnique({ where: { id: authorId }, select: { id: true } });
      if (user) validAuthorId = user.id;
    }

    const publishedAt = this.parseDate(data.publishedAt) || new Date();

    return this.prisma.blogPost.create({
      data: {
        tenantId,
        authorId: validAuthorId,
        title: data.title,
        slug,
        excerpt: data.excerpt || null,
        content: data.content,
        coverImage: data.coverImage || null,
        category: data.category || 'Real Estate',
        tags: Array.isArray(data.tags) ? data.tags : [],
        isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
        publishedAt,
      }
    });
  }

  async updateBlog(tenantId: string, id: string, data: any) {
    const current = await this.getBlog(tenantId, id);
    let slug = data.slug ? this.generateSlug(data.slug) : undefined;
    
    if (slug && slug !== current.slug) {
      const existing = await this.prisma.blogPost.findFirst({
        where: { tenantId, slug, id: { not: id } }
      });
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (slug) updateData.slug = slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = Array.isArray(data.tags) ? data.tags : [];
    if (data.isPublished !== undefined) updateData.isPublished = Boolean(data.isPublished);
    if (data.publishedAt !== undefined) {
      const pDate = this.parseDate(data.publishedAt);
      if (pDate) updateData.publishedAt = pDate;
    }

    return this.prisma.blogPost.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBlog(tenantId: string, id: string) {
    await this.getBlog(tenantId, id);
    return this.prisma.blogPost.delete({
      where: { id }
    });
  }
}
