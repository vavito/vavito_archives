import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import type { Observable } from 'rxjs';

import type { AuthenticatedRequest } from '@api/core/auth/interfaces/authenticated-user.interface';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    this.logger.assign(
      request.user?.id
        ? { actorId: request.user.id, actorType: 'authenticated' }
        : { actorType: 'anonymous' },
    );

    return next.handle();
  }
}
