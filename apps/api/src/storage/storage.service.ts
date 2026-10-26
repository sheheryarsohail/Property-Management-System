// src/storage/storage.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'node:fs/promises';
import * as fss from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'crypto';
import type { FastifyReply } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';

function isTrue(v?: string) {
  return v === '1' || v === 'true';
}

type StoragePutResult = {
  id: string;
  key: string;
  sha256: string;
  size: number;
  contentType: string;
  url?: string;
  deduped: boolean;
  expiresAt: string | null;
  mode: 's3' | 'local';
};

type PutOpts = {
  tenantId: string;
  contentType: string;
  ttlDays?: number;
  keyHint?: string;
  idempotencyKey?: string;
  public?: boolean;
};

export type StreamOpts = {
  cacheControl?: string;
  disposition?: 'inline' | 'attachment';
  filename?: string;
  /** If provided, and equals the resource ETag, we return 304 without body */
  etagCheck?: string;
};

@Injectable()
export class StorageService {
  private readonly useS3: boolean;
  private readonly s3?: S3Client;
  private readonly bucket?: string;
  private readonly localRoot: string;

  // 🔌 Kill-switch for idempotency (dev convenience)
  private readonly disableIdem =
    process.env.DISABLE_PDF_IDEM === '1' || process.env.DISABLE_PDF_IDEM === 'true';

  constructor(private readonly prisma: PrismaService) {
    this.useS3 =
      !!process.env.S3_BUCKET &&
      !!process.env.S3_ACCESS_KEY_ID &&
      !!process.env.S3_SECRET_ACCESS_KEY;

    this.localRoot = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), 'var', 'storage');

    if (this.useS3) {
      this.s3 = new S3Client({
        region: process.env.S3_REGION || 'us-east-1',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: isTrue(process.env.S3_FORCE_PATH_STYLE) || undefined,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
      });
      this.bucket = process.env.S3_BUCKET!;
    } else {
      if (!fss.existsSync(this.localRoot)) {
        fss.mkdirSync(this.localRoot, { recursive: true });
      }
    }
  }

  // ───────────────────────── helpers ─────────────────────────

  private normalizeKey(key: string) {
    return key.replace(/^\/+/, '');
  }

  private sha256(buf: Buffer): string {
    const h = createHash('sha256');
    h.update(buf);
    return h.digest('hex');
  }

  private buildKey(params: { tenantId: string; sha256: string; keyHint?: string }) {
    const base = `${params.tenantId}/${params.sha256}`;
    if (!params.keyHint) return base;
    const safe = params.keyHint.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    return `${base}/${safe}`;
  }

  private publicUrl(key: string): string | undefined {
    const base = process.env.STORAGE_PUBLIC_BASE_URL;
    if (!base) return undefined;
    return `${base.replace(/\/$/, '')}/${encodeURI(key)}`;
  }

  private guessContentType(key: string) {
    const k = key.toLowerCase();
    if (k.endsWith('.pdf')) return 'application/pdf';
    if (k.endsWith('.json')) return 'application/json';
    if (k.endsWith('.txt')) return 'text/plain; charset=utf-8';
    return 'application/octet-stream';
  }

  private weakEtagFromStat(size: number, mtimeMs: number) {
    return `W/"${size.toString(16)}-${Math.floor(mtimeMs).toString(16)}"`;
  }

  /**
   * Always prefer a **stable** ETag:
   *  1) DB sha256 → W/"sha256-<sha>"
   *  2) backend (S3) ETag
   *  3) undefined (caller may synthesize weak ETag from file stat)
   */
  private async stableEtagForKey(key: string, backendEtag?: string): Promise<string | undefined> {
    const norm = this.normalizeKey(key);
    try {
      const row = await this.prisma.storageObject.findUnique({ where: { key: norm } });
      if (row?.sha256) return `W/"sha256-${row.sha256}"`;
    } catch {
      // ignore — fall through
    }
    if (backendEtag && backendEtag.trim() !== '') return backendEtag;
    return undefined;
  }

  private async writeBlob(key: string, data: Buffer, contentType: string) {
    key = this.normalizeKey(key);
    if (this.useS3 && this.s3 && this.bucket) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: data,
          ContentType: contentType,
          ACL: 'private',
        }),
      );
    } else {
      const full = path.join(this.localRoot, key);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, data);
    }
  }

  // ───────────────────────── HEAD (metadata without body) ─────────────────────────
  async head(key: string): Promise<{ contentType?: string; etag?: string }> {
    key = this.normalizeKey(key);

    // Try DB-stable ETag without touching storage
    const dbStable = await this.stableEtagForKey(key);
    if (dbStable) {
      return { contentType: this.guessContentType(key), etag: dbStable };
    }

    if (this.useS3 && this.s3 && this.bucket) {
      const out = await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      const contentType = out.ContentType || this.guessContentType(key);
      const backendEtag = typeof out.ETag === 'string' ? out.ETag : undefined;
      const etag = backendEtag || undefined;
      return { contentType, etag };
    }

    // Local fallback (no DB row): synthesize weak ETag from stat
    const full = path.join(this.localRoot, key);
    try {
      const stat = await fs.stat(full);
      const etag = this.weakEtagFromStat(stat.size, stat.mtimeMs);
      return { contentType: this.guessContentType(key), etag };
    } catch (e: any) {
      if (e?.code === 'ENOENT') throw new NotFoundException(`Object not found: ${key}`);
      throw e;
    }
  }

  // ───────────────────────── read (body) ─────────────────────────

  /** Read object as Buffer (throws 404 on missing) */
  async read(key: string): Promise<Buffer> {
    key = this.normalizeKey(key);
    if (this.useS3 && this.s3 && this.bucket) {
      const out = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const body = out.Body as any; // Node.js Readable
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        body.on('data', (c: Buffer) => chunks.push(c));
        body.on('end', resolve);
        body.on('error', reject);
      });
      return Buffer.concat(chunks);
    }
    const full = path.join(this.localRoot, key);
    try {
      return await fs.readFile(full);
    } catch {
      throw new NotFoundException(`Object not found: ${key}`);
    }
  }

  /** Read object as stream + metadata (Content-Type, ETag) */
  async readStream(
    key: string,
  ): Promise<{ stream: NodeJS.ReadableStream; contentType?: string; etag?: string }> {
    key = this.normalizeKey(key);

    if (this.useS3 && this.s3 && this.bucket) {
      const out = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
      const stream = out.Body as NodeJS.ReadableStream;
      const contentType = out.ContentType || this.guessContentType(key);
      const backendEtag = typeof out.ETag === 'string' ? out.ETag : undefined;
      const etag = await this.stableEtagForKey(key, backendEtag);
      return { stream, contentType, etag };
    }

    const full = path.join(this.localRoot, key);
    let stat;
    try {
      stat = await fs.stat(full);
    } catch (e: any) {
      if (e?.code === 'ENOENT') throw new NotFoundException(`Object not found: ${key}`);
      throw e;
    }
    const stream = fss.createReadStream(full);
    const contentType = this.guessContentType(key);

    // Prefer DB-stable ETag; if missing (unexpected for local), synthesize weak ETag
    const row = await this.prisma.storageObject.findUnique({ where: { key } }).catch(() => null);
    const etag = row?.sha256 ? `W/"sha256-${row.sha256}"` : this.weakEtagFromStat(stat.size, stat.mtimeMs);

    return { stream, contentType, etag };
  }

  /**
   * Stream to Fastify reply with extra options:
   * - Uses HEAD first to compare ETag (cheap), returns 304 if match
   * - Sets Content-Type, ETag, Cache-Control
   * - Supports Content-Disposition (inline/attachment; filename)
   */
  async stream(key: string, res: FastifyReply, opts?: StreamOpts): Promise<void> {
    key = this.normalizeKey(key);

    // Cheap HEAD first if client sent If-None-Match
    if (opts?.etagCheck) {
      try {
        const meta = await this.head(key);
        if (meta.etag && meta.etag === opts.etagCheck) {
          if (opts.cacheControl) res.header('Cache-Control', opts.cacheControl);
          res.header('ETag', meta.etag);
          res.header('X-ETag-Source', 'head');
          res.header('Content-Length', '0');
          if (meta?.contentType) res.type(meta.contentType);
          res.code(304).send();
          return;
        }
      } catch {
        // Fall through to full stream path (will 404 if actually missing)
      }
    }

    const { stream, contentType, etag } = await this.readStream(key);

    if (opts?.cacheControl) res.header('Cache-Control', opts.cacheControl);
    if (etag) {
      res.header('ETag', etag);
      res.header('X-ETag-Source', 'readStream');
    }
    res.type(contentType || this.guessContentType(key));

    if (opts?.disposition) {
      const safe = opts.filename ? opts.filename.replace(/[\r\n"]/g, '_') : undefined;
      const cd =
        safe
          ? `${opts.disposition}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`
          : opts.disposition;
      res.header('Content-Disposition', cd);
    }

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('end', resolve);
      stream.pipe(res.raw);
    });
  }

  // ───────────────────── idempotent + dedupe write ─────────────────────
  async putObjectIdempotent(data: Buffer, opts: PutOpts): Promise<StoragePutResult> {
    if (!opts?.tenantId) throw new BadRequestException('tenantId is required');
    if (!opts?.contentType) throw new BadRequestException('contentType is required');

    const sha = this.sha256(data);
    const useIdem = !this.disableIdem && !!opts.idempotencyKey;

    // 1) DEDUPE
    const existing = await this.prisma.storageObject.findFirst({
      where: { tenantId: opts.tenantId, sha256: sha },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      const stillThere = await this.exists(existing.key);
      if (!stillThere) {
        await this.writeBlob(existing.key, data, opts.contentType);
        if (existing.size !== data.byteLength || existing.contentType !== opts.contentType) {
          await this.prisma.storageObject.update({
            where: { id: existing.id },
            data: { size: data.byteLength, contentType: opts.contentType },
          });
        }
        // eslint-disable-next-line no-console
        console.warn(`[storage] restored missing blob for key=${existing.key}`);
      }

      const response: StoragePutResult = {
        id: existing.id,
        key: existing.key,
        sha256: existing.sha256,
        size: existing.size,
        contentType: existing.contentType,
        url: this.publicUrl(existing.key),
        deduped: true,
        expiresAt: existing.expiresAt ? existing.expiresAt.toISOString() : null,
        mode: this.useS3 ? 's3' : 'local',
      };

      if (useIdem) {
        await this.recordIdem({
          idempotencyKey: opts.idempotencyKey!,
          tenantId: opts.tenantId,
          response,
          overwrite: false,
        });
      }

      return response;
    }

    // 2) IDEMPOTENCY replay (no dedupe row)
    if (useIdem) {
      const idem = await this.prisma.idempotencyKey.findUnique({
        where: { key_scope: { key: opts.idempotencyKey!, scope: opts.tenantId } },
      });

      if (idem?.response) {
        const resp = idem.response as StoragePutResult;
        const ok = await this.exists(resp.key);
        if (!ok) {
          await this.writeBlob(resp.key, data, opts.contentType);
          await this.prisma.storageObject.upsert({
            where: { key: resp.key }, // requires @unique on StorageObject.key
            create: {
              key: resp.key,
              sha256: sha,
              size: data.byteLength,
              contentType: opts.contentType,
              tenantId: opts.tenantId,
              expiresAt: null,
            },
            update: { size: data.byteLength, contentType: opts.contentType, sha256: sha },
          });
          // eslint-disable-next-line no-console
          console.warn(`[storage] restored missing blob from idempotency for key=${resp.key}`);
        }
        return resp;
      }
    }

    // 3) NEW write
    const key = this.buildKey({ tenantId: opts.tenantId, sha256: sha, keyHint: opts.keyHint });
    await this.writeBlob(key, data, opts.contentType);

    const expiresAtDate =
      typeof opts.ttlDays === 'number'
        ? new Date(Date.now() + opts.ttlDays * 86_400_000)
        : null;

    const row = await this.prisma.storageObject.create({
      data: {
        key,
        sha256: sha,
        size: data.byteLength,
        contentType: opts.contentType,
        tenantId: opts.tenantId,
        expiresAt: expiresAtDate ?? undefined,
      },
    });

    const response: StoragePutResult = {
      id: row.id,
      key,
      sha256: sha,
      size: data.byteLength,
      contentType: opts.contentType,
      url: this.publicUrl(key),
      deduped: false,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      mode: this.useS3 ? 's3' : 'local',
    };

    if (useIdem) {
      await this.recordIdem({
        idempotencyKey: opts.idempotencyKey!,
        tenantId: opts.tenantId,
        response,
        overwrite: true,
      });
    }

    return response;
  }

  /** Convenience for PDFs – same as putObjectIdempotent with application/pdf */
  async putPdfIdempotent(
    data: Buffer,
    opts: Omit<PutOpts, 'contentType'>,
  ): Promise<StoragePutResult> {
    return this.putObjectIdempotent(data, { ...opts, contentType: 'application/pdf' });
  }

  // ───────────────────── direct write / existence ─────────────────────

  async putPdf(key: string, buf: Buffer, contentType = 'application/pdf'): Promise<void> {
    await this.writeBlob(key, buf, contentType);
  }

  async exists(key: string): Promise<boolean> {
    key = this.normalizeKey(key);
    if (this.useS3 && this.s3 && this.bucket) {
      try {
        await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
        return true;
      } catch {
        return false;
      }
    }
    try {
      await fs.access(path.join(this.localRoot, key));
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await this.read(key);
    } catch {
      return null;
    }
  }

  /**
   * Presigned GET URL:
   *  - S3: real presigned URL
   *  - Local: if STORAGE_PUBLIC_BASE_URL or PUBLIC_BASE_URL is set, returns app URL to /storage/objects/:key (still requires API key)
   */
  async presignGet(key: string, expiresInSec = 300): Promise<string> {
    key = this.normalizeKey(key);
    if (this.useS3 && this.s3 && this.bucket) {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      return getSignedUrl(this.s3, cmd, { expiresIn: expiresInSec });
    }

    const base =
      process.env.STORAGE_PUBLIC_BASE_URL ||
      process.env.PUBLIC_BASE_URL ||
      undefined;

    if (base) {
      const baseClean = base.replace(/\/$/, '');
      const encoded = encodeURIComponent(key);
      return `${baseClean}/storage/objects/${encoded}`;
    }

    throw new Error('presignGet is only available in S3 mode or when a PUBLIC base URL is configured');
  }

  // Aliases (compat)
  async uploadFile(key: string, buf: Buffer, contentType = 'application/pdf'): Promise<void> {
    return this.putPdf(key, buf, contentType);
  }

  async getSignedUrl(key: string, expiresInSec = 300, _opts?: unknown): Promise<string> {
    return this.presignGet(key, expiresInSec);
  }

  /** Health for diagnostics */
  async health(): Promise<{
    ok: boolean;
    mode: 's3' | 'local';
    bucket?: string;
    endpoint?: string;
    error?: string;
  }> {
    if (this.useS3 && this.s3 && this.bucket) {
      try {
        await this.s3.config.credentials();
        return {
          ok: true,
          mode: 's3',
          bucket: this.bucket,
          endpoint: process.env.S3_ENDPOINT || undefined,
        };
      } catch (e: any) {
        return {
          ok: false,
          mode: 's3',
          bucket: this.bucket,
          endpoint: process.env.S3_ENDPOINT || undefined,
          error: e?.message || String(e),
        };
      }
    }
    try {
      const test = path.join(this.localRoot, '.health');
      await fs.mkdir(this.localRoot, { recursive: true });
      await fs.writeFile(test, 'ok').catch(() => {});
      await fs.unlink(test).catch(() => {});
      return { ok: true, mode: 'local' };
    } catch (e: any) {
      return { ok: false, mode: 'local', error: e?.message || String(e) };
    }
  }

  /** Hard delete blob + metadata */
  async delete(key: string): Promise<{ ok: true }> {
    key = this.normalizeKey(key);
    if (this.useS3 && this.s3 && this.bucket) {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } else {
      const full = path.join(this.localRoot, key);
      await fs.rm(full, { force: true });
    }
    // Also purge DB metadata so dedupe won't point to a missing blob later
    await this.prisma.storageObject.deleteMany({ where: { key } });
    return { ok: true };
  }

  // ───────────────────────── idempotency bookkeeping ─────────────────────────
  private async recordIdem(opts: {
    idempotencyKey: string;
    tenantId: string;
    response: StoragePutResult;
    overwrite: boolean;
  }) {
    try {
      if (opts.overwrite) {
        await this.prisma.idempotencyKey.upsert({
          where: { key_scope: { key: opts.idempotencyKey, scope: opts.tenantId } },
          create: {
            key: opts.idempotencyKey,
            scope: opts.tenantId,
            response: opts.response,
            tenantId: opts.tenantId,
          },
          update: {
            response: opts.response,
            tenantId: opts.tenantId,
          },
        });
      } else {
        await this.prisma.idempotencyKey.upsert({
          where: { key_scope: { key: opts.idempotencyKey, scope: opts.tenantId } },
          create: {
            key: opts.idempotencyKey,
            scope: opts.tenantId,
            response: opts.response,
            tenantId: opts.tenantId,
          },
          update: {}, // keep first response on the dedupe path
        });
      }
    } catch (e) {
      // Never fail the main path because of bookkeeping
      // eslint-disable-next-line no-console
      console.warn('[idem] upsert failed', e);
    }
  }
}
