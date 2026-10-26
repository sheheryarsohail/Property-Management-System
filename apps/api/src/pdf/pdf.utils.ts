import { PdfKind } from "./pdf.types";

export function idemKey(kind: PdfKind, id: string, version = 'v1') {
  return `pdf:${kind}:${id}:${version}`;
}

export function keyOf(kind: PdfKind, id: string) {
  return `${kind}s/${id}.pdf`;
}

export function isTrue(v?: string) {
  return v === '1' || v === 'true';
}
