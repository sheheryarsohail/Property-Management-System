import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<any>();
    const res = ctx.getResponse<any>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errBody = isHttp ? (exception as HttpException).getResponse() : null;
    const detail =
      (typeof errBody === 'object' && (errBody as any)?.message) ||
      (exception as any)?.message ||
      String(exception);

    const body = {
      type: `urn:problem:${exception?.constructor?.name ?? 'Error'}`,
      title: isHttp ? HttpStatus[status] ?? 'Error' : 'Internal Server Error',
      status,
      detail,
      instance: req?.url ?? '',
    };

    // Set content-type once
    const setContentType = () => {
      try {
        if (typeof res.type === 'function') {
          res.type('application/problem+json');
        } else if (typeof res.setHeader === 'function') {
          res.setHeader('Content-Type', 'application/problem+json');
        }
      } catch {}
    };

    // Prefer Fastify's reply if available (.code/.status + .send)
    if (res && typeof res.send === 'function') {
      setContentType();
      if (typeof res.code === 'function') {
        // Fastify style
        return res.code(status).send(body);
      }
      if (typeof res.status === 'function') {
        // Some adapters expose .status
        return res.status(status).send(body);
      }
    }

    // Fallback for bare Node/Express
    try {
      setContentType();
      if ('status' in res && typeof res.status === 'function') {
        return res.status(status).send(body);
      }
      if ('statusCode' in res) {
        res.statusCode = status;
      }
      return res.end?.(JSON.stringify(body));
    } catch {
      // Last-ditch: console + swallow (avoid crash loop)
      // eslint-disable-next-line no-console
      console.error('ProblemDetailsFilter fallback error:', exception);
    }
  }
}
