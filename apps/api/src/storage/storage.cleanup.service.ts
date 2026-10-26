import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageCleanupService {
  private s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'auto',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' ? true : undefined,
    credentials: process.env.S3_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        }
      : undefined,
  });
  private bucket = process.env.S3_BUCKET!;
  private log = new Logger(StorageCleanupService.name);

  constructor(private prisma: PrismaService) {}

  async runOnce(limit = 200) {
    const now = new Date();
    const expired = await this.prisma.storageObject.findMany({
      where: { expiresAt: { lte: now } },
      take: limit,
      orderBy: { expiresAt: 'asc' },
    });

    if (expired.length === 0) {
      return { deleted: 0 };
    }

    if (this.bucket && process.env.S3_ACCESS_KEY_ID) {
      try {
        await this.s3.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Objects: expired.map((f) => ({ Key: f.key })),
              Quiet: true,
            },
          }),
        );
      } catch (e) {
        this.log.warn(`S3 batch delete failed for ${expired.length} objects: ${String(e)}`);
      }
    }

    const ids = expired.map((f) => f.id);
    const deleteResult = await this.prisma.storageObject.deleteMany({
      where: { id: { in: ids } },
    });

    return { deleted: deleteResult.count };
  }
}
