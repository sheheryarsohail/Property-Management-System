import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as crypto from "crypto";
import { ApiKeyService } from "../../auth/api-key.service";
import { SCOPES_KEY } from "../../auth/scopes.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PrismaService } from "../../prisma/prisma.service";

function norm(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function hasScope(have: Set<string>, need: string): boolean {
  need = norm(need);
  if (!need) return true;
  if (have.has("*")) return true;
  if (have.has(need)) return true;

  const [action] = need.split(":", 1);
  if (action && have.has(`${action}:*`)) return true;

  const parts = need.split(":");
  for (let i = parts.length - 1; i > 0; i--) {
    const prefix = parts.slice(0, i).join(":");
    if (have.has(`${prefix}:*`)) return true;
  }
  return false;
}

function getUnprefixedPath(url: string, apiPrefix?: string) {
  const pathname = url.split("?")[0] || "/";
  const p = (apiPrefix || "").replace(/^\/+|\/+$/g, "");
  if (!p) return pathname;
  const needle = `/${p}`;
  return pathname.startsWith(needle) ? pathname.slice(needle.length) || "/" : pathname;
}

export function verifyJwtToken(token: string, secret: string): any {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url");
  if (s !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8"));
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // ✅ public endpoints bypass the API key requirement
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<any>();
    const headers = (req?.headers ?? {}) as Record<string, string | undefined>;

    // ── Public endpoints (bypass auth)
    const path = getUnprefixedPath(req?.url ?? "", process.env.API_PREFIX);
    const PUBLIC = new Set<string>(["/live", "/ready", "/healthz", "/docs", "/docs-json"]);
    if (PUBLIC.has(path)) return true;

    // ── Accept x-api-key or Authorization: ApiKey <token>
    const headerKey = headers["x-api-key"];
    const authz = headers["authorization"];
    const token =
      headerKey ??
      (authz && /^apikey\s+/i.test(authz)
        ? authz.replace(/^apikey\s+/i, "").trim()
        : undefined);

    if (!token) throw new UnauthorizedException("Missing x-api-key");

    const principal = this.apiKeyService.verify(token);
    if (!principal) throw new UnauthorizedException("Invalid API key");

    // attach downstream
    req.auth = { ...principal };

    // ── If Authorization: Bearer <token> is present, verify and attach user & enforce tenant access
    if (authz && /^bearer\s+/i.test(authz)) {
      const jwtToken = authz.replace(/^bearer\s+/i, "").trim();
      const secret = process.env.JWT_SECRET || "02c69f4cc9d911c4b97ab30567b8b786dda00b8f2cead185b23ca01f892d62aa";
      const payload = verifyJwtToken(jwtToken, secret);
      if (payload && payload.sub) {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          include: { customer: true, tenantAccess: true },
        });

        if (user) {
          req.user = user;

          // Tenant Access Enforcement for non-SUPER_ADMIN
          if (user.role !== "SUPER_ADMIN") {
            const isTenantAgnostic = path.includes("/tenants") || path.includes("/auth/");
            if (!isTenantAgnostic) {
              const tenantId = (headers["x-tenant-id"] as string) || "t_local";
              
              if (tenantId === "all") {
                throw new ForbiddenException("Consolidated property view is only available to Super Admin");
              }

              const allowedTenantIds = user.tenantAccess?.length > 0
                ? user.tenantAccess.map((ta: any) => ta.tenantId)
                : (user.tenantId ? [user.tenantId] : []);

              if (!allowedTenantIds.includes(tenantId)) {
                throw new ForbiddenException("You do not have access to this property");
              }
            }
          }
        }
      }
    }

    // ── Check route-required scopes (if any)
    const neededRaw =
      this.reflector.getAllAndOverride<string[] | undefined>(SCOPES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    if (!neededRaw.length) return true;

    // normalize scopes (supports array or iterable like Set)
    const iterable: any = (principal as any).scopes;
    const rawScopes: string[] = Array.isArray(iterable)
      ? iterable
      : iterable && typeof iterable[Symbol.iterator] === "function"
        ? Array.from(iterable as Iterable<string>)
        : [];

    const have = new Set<string>(rawScopes.map(norm));
    const ok = neededRaw.every((n) => hasScope(have, n));
    if (!ok) throw new ForbiddenException("Insufficient scope");

    return true;
  }
}
