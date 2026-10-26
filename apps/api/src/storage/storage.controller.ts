// src/storage/storage.controller.ts
import {
  Controller,
  Get,
  Delete,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
  Head,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { StorageService } from './storage.service';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiOkResponse,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiKeyProtected } from '../auth/api-key.decorator';
import { Scopes } from '../auth/scopes.decorator';

function isTrue(v?: string) { return v === '1' || v === 'true'; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function parseTtl(s?: string) {
  const n = Number.parseInt(String(s ?? ''), 10);
  if (!Number.isFinite(n)) return 300;
  return clamp(n, 60, 604_800); // 1 min .. 7 days
}
// normalize weak/strong ETags: W/"abc" → abc
function normEtag(s: string) { return s.replace(/^W\//, '').replace(/"/g, ''); }

@ApiTags('Storage')
@ApiSecurity('x-api-key')
@ApiKeyProtected()
@Controller('storage')
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  // Helper: extract the wildcard tail and safely decode it
  private getKeyFromWildcard(req: FastifyRequest): string {
    const params: any = (req as any).params ?? {};
    // For `objects/*`, Fastify typically puts the wildcard into param "0" (sometimes "*")
    // For `objects/:key`, it will be under "key"
    const raw = params['key'] ?? params['0'] ?? params['*'] ?? '';
    try {
      return decodeURIComponent(String(raw));
    } catch {
      return String(raw);
    }
  }

  @Get('objects/*')
  @Scopes('read:storage')
  @ApiOperation({ summary: 'Read object or return a presigned URL (use ?presign=1&ttl=seconds)' })
  @ApiQuery({ name: 'presign', required: false, description: '1/true → return {key,url,ttl} instead of streaming' })
  @ApiQuery({ name: 'ttl', required: false, description: 'Presign TTL in seconds (60..604800); default 300' })
  @ApiOkResponse({ description: 'Returns {key,url,ttl} when presign=1, else streams/returns the file' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getObject(
    @Query('presign') presign: string | undefined,
    @Query('ttl') ttlStr: string | undefined,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const key = this.getKeyFromWildcard(req);
    if (!key) throw new BadRequestException('key is required');

    // Presign branch (S3 → real presign, local → app URL to /storage/objects/:key)
    if (isTrue(presign)) {
      const ttl = parseTtl(ttlStr);
      const url = await this.storage.presignGet(key, ttl);
      return res.status(200).send({ key, url, ttl });
    }

    // Prefer readStream(); fallback to read()
    const anyStorage = this.storage as any;

    if (typeof anyStorage.readStream === 'function') {
      const r = await anyStorage.readStream(key);

      // Conditional GET: 304 if ETag matches
      const inm = (req.headers['if-none-match'] as string | undefined) ?? '';
      if (r?.etag && inm && normEtag(inm) === normEtag(r.etag)) {
        return res
          .header('ETag', r.etag)
          .header('Cache-Control', 'private, max-age=300')
          .header('Vary', 'If-None-Match')
          .status(304)
          .send();
      }

      if (r?.etag) res.header('ETag', r.etag);
      res.header('Cache-Control', 'private, max-age=300').header('Vary', 'If-None-Match');

      const ctype = r?.contentType ?? 'application/octet-stream';
      res.type(ctype);

      if (r?.stream && typeof r.stream.pipe === 'function') {
        // Fastify can send a stream directly
        return res.send(r.stream);
      }

      // If service returned a Buffer instead of a stream
      if (r instanceof Buffer) {
        return res.header('Content-Length', String(r.length)).send(r);
      }

      // Last resort: send whatever the service returned
      return res.send(r);
    }

    if (typeof anyStorage.read === 'function') {
      const buf: Buffer = await anyStorage.read(key);
      return res
        .type('application/octet-stream')
        .header('Content-Length', String(buf.length))
        .header('Cache-Control', 'private, max-age=300')
        .header('Vary', 'If-None-Match')
        .send(buf);
    }

    return res.status(501).send({ error: 'StorageService does not implement read or readStream' });
  }

  // HEAD: quick existence + ETag without body
  @Head('objects/*')
  @Scopes('read:storage')
  @ApiOperation({ summary: 'HEAD for object (existence + ETag), no body' })
  @ApiResponse({ status: 200, description: 'Object exists' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async headObject(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const key = this.getKeyFromWildcard(req);
    if (!key) throw new BadRequestException('key is required');

    const anyStorage = this.storage as any;
    if (typeof anyStorage.readStream === 'function') {
      const r = await anyStorage.readStream(key); // throws 404 if missing
      if (r?.etag) res.header('ETag', r.etag);
      res.header('Cache-Control', 'private, max-age=300').header('Vary', 'If-None-Match');
      if (r?.contentType) res.type(r.contentType);
      return res.status(200).send();
    }

    // Fallback to exists()
    const exists = await this.storage.exists(key);
    return res.status(exists ? 200 : 404).send();
  }

  @Delete('objects/*')
  @Scopes('write:storage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an object (and purge its metadata)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async deleteObject(@Req() req: FastifyRequest) {
    const key = this.getKeyFromWildcard(req);
    if (!key) throw new BadRequestException('key is required');
    await this.storage.delete(key);
  }

  @Get('health')
  @Scopes('read:storage')
  @ApiOperation({ summary: 'Storage health' })
  @ApiOkResponse({ description: 'Mode + health status' })
  async health() {
    return this.storage.health();
  }
}
