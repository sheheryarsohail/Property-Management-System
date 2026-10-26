import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from './scopes.decorator';

function norm(s: string) {
  return String(s ?? '').trim().toLowerCase();
}

/** Supports *, action:*, hierarchical prefixes like read:storage:* */
function hasScope(have: Set<string>, need: string): boolean {
  need = norm(need);
  if (!need) return true;
  if (have.has('*')) return true;
  if (have.has(need)) return true;

  // action:* (e.g., read:*)
  const [action] = need.split(':', 1);
  if (action && have.has(`${action}:*`)) return true;

  // hierarchical: read:storage:objects → read:storage:*
  const parts = need.split(':');
  for (let i = parts.length - 1; i > 0; i--) {
    const prefix = parts.slice(0, i).join(':');
    if (have.has(`${prefix}:*`)) return true;
  }

  return false;
}

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const needed = this.reflector.getAllAndOverride<string[] | undefined>(SCOPES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) ?? [];

    if (!needed.length) return true;

    const req = ctx.switchToHttp().getRequest<any>();
    const authScopes: Set<string> =
      req?.auth?.scopes instanceof Set
        ? req.auth.scopes
        : new Set<string>(Array.isArray(req?.auth?.scopes) ? req.auth.scopes : []);

    const have = new Set<string>(Array.from(authScopes).map(norm));
    const ok = needed.every((n) => hasScope(have, n));
    if (!ok) throw new ForbiddenException('Insufficient scope');
    return true;
  }
}
