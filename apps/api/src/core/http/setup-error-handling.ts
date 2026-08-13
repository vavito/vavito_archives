import type { INestApplication } from '@nestjs/common';

import { GlobalExceptionFilter } from '@api/core/http/filters/global-exception.filter';
import { createValidationPipe } from '@api/core/http/pipes/validation.pipe';

export function setupErrorHandling(app: INestApplication): void {
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(createValidationPipe());
}
