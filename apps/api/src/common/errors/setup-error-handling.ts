import type { INestApplication } from '@nestjs/common';

import { GlobalExceptionFilter } from '@api/common/errors/global-exception.filter';
import { createValidationPipe } from '@api/common/errors/validation.pipe';

export function setupErrorHandling(app: INestApplication): void {
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(createValidationPipe());
}
