// import {
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { ApiKeyService } from './api-key.service';
// import { SCOPES_KEY } from './scopes.decorator';
// import { IS_PUBLIC_KEY } from './public.decorator';

// function norm(s: string) {
//   return String(s ?? '').trim().toLowerCase();
// }
// function hasScope(have: Set<string>, need: string): boolean {
//   need = norm(need);
//   if (!need) return true;
//   if (have.has('*') || have.has(need)) return true;

//   // read:* style
//   const [action] = need.split(':', 1);
//   if (action && have.has(`${action}:*`)) return true;

//   // hierarchical prefixes: read:storage:objects -> read:storage:*
//   const parts = need.split(':');
//   for (let i = parts.length - 1; i > 0; i--) {
//     const prefix = parts.slice(0, i).join(':');
//     if (have.has(`${prefix}:*`)) return true;
//   }
//   return false;
// }

// @Injectable()
// export class ApiKeyGuard implements CanActivate {
//   constructor(
//     private readonly apiKeyService: ApiKeyService,
//     private readonly reflector: Reflector,
//   ) {}

//   async canActivate(ctx: ExecutionContext): Promise<boolean> {
//     // ✅ Public endpoints short-circuit
//     const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
//       ctx.getHandler(),
//       ctx.getClass(),
//     ]);
//     if (isPublic) return true;

//     const req = ctx.switchToHttp().getRequest<any>();
//     const headers = (req?.headers ?? {}) as Record<string, string | undefined>;

//     // Accept x-api-key or Authorization: ApiKey <token>
//     const headerKey = headers['x-api-key'];
//     const authz = headers['authorization'];
//     const token =
//       headerKey ??
//       (authz && /^apikey\s+/i.test(authz)
//         ? authz.replace(/^apikey\s+/i, '').trim()
//         : undefined);

//     if (!token) throw new UnauthorizedException('Missing x-api-key');

//     const auth = this.apiKeyService.verify(token);
//     if (!auth) throw new UnauthorizedException('Invalid API key');

//     // Attach auth for downstream
//     req.auth = { ...auth };

//     // Scope check (if required on the route/class)
//     const required = this.reflector.getAllAndOverride<string[] | undefined>(SCOPES_KEY, [
//       ctx.getHandler(),
//       ctx.getClass(),
//     ]) ?? [];

//     if (!required.length) return true;

//     // Normalize whatever came from service into a Set<string>
//     const rawScopes: string[] = Array.isArray((auth as any).scopes)
//       ? (auth as any).scopes
//       : (auth && (auth as any).scopes && typeof (auth as any).scopes[Symbol.iterator] === 'function')
//         ? Array.from((auth as any).scopes as Iterable<string>)
//         : [];
//     const have = new Set<string>(rawScopes.map(norm));

//     const ok = required.every((n) => hasScope(have, n));
//     if (!ok) throw new ForbiddenException('Insufficient scope');

//     return true;
//   }
// }
