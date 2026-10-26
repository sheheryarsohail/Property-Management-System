import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { PdfKind, PdfMeta } from './pdf.types';
import { sha256 } from './pdf.base';
import { idemKey, keyOf } from './pdf.utils';

@Injectable()
export class PdfStorage {
  constructor(private readonly storage: StorageService) {}

  async store(
    opts: { tenantId: string; kind: PdfKind; id: string; buffer: Buffer; keyHint?: string; version?: string }
  ): Promise<PdfMeta> {
    const { tenantId, kind, id, buffer, keyHint, version = 'v1' } = opts;
    const key = keyHint ?? keyOf(kind, id);
    const idempotencyKey = idemKey(kind, id, version);
    const hash = sha256(buffer);

   const putRes = await this.storage.putPdfIdempotent(
  buffer,                       // first arg MUST be Buffer
  {
    tenantId,
    idempotencyKey,
    keyHint: key,               // pass path/name here
    // sha256: hash,            // omit unless your PutOpts includes it
  }
);
    // putRes should be { id, key, url? }
    return { ...putRes, sha256: hash };
  }
}
