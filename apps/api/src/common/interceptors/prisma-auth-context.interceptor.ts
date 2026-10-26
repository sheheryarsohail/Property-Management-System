// apps/api/src/common/interceptors/prisma-auth-context.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { authContextStorage } from '../context/auth-context.storage';

@Injectable()
export class PrismaAuthContextInterceptor implements NestInterceptor {
  constructor(private prisma?: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: any = context.switchToHttp().getRequest();
    const auth = req?.auth ?? req?.raw?.auth; // works for Fastify too
    const authData = (auth?.tenantId && auth?.userId)
      ? { tenantId: auth.tenantId, userId: auth.userId }
      : undefined;

    return new Observable((subscriber) => {
      authContextStorage.run(authData, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
