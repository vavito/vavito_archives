import { HttpException, type HttpExceptionOptions, type HttpStatus } from '@nestjs/common';

import type { ErrorDetailDto } from '@api/common/errors/dto/error-response.dto';

export interface ApplicationExceptionOptions {
  code: string;
  details?: ErrorDetailDto[] | null;
  message: string;
  statusCode: HttpStatus;
  cause?: unknown;
}

export class ApplicationException extends HttpException {
  readonly code: string;
  readonly details: ErrorDetailDto[] | null;

  constructor(options: ApplicationExceptionOptions) {
    const exceptionOptions: HttpExceptionOptions | undefined =
      options.cause === undefined ? undefined : { cause: options.cause };

    super(options.message, options.statusCode, exceptionOptions);
    this.code = options.code;
    this.details = options.details ?? null;
  }
}
