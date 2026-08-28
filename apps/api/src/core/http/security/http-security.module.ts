import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { RATE_LIMITS } from '@api/core/http/security/http-security.constants';
import { createRateLimitTracker } from '@api/core/http/security/rate-limit-tracker';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      errorMessage: 'Limite de requisições excedido.',
      getTracker: createRateLimitTracker,
      throttlers: [{ name: 'default', ...RATE_LIMITS.default }],
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class HttpSecurityModule {}
