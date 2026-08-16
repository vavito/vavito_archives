import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

import type { ErrorDetailDto } from '@api/core/http/dto/error-response.dto';
import { ApplicationException } from '@api/core/http/exceptions/application.exception';

const reasonByConstraint: Readonly<Record<string, string>> = {
  isDefined: 'REQUIRED',
  isEmail: 'INVALID_EMAIL',
  isNotEmpty: 'REQUIRED',
  isUUID: 'INVALID_UUID',
  whitelistValidation: 'FIELD_NOT_ALLOWED',
};

function normalizeConstraintName(name: string): string {
  return name.replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

function validationDetails(errors: ValidationError[], parentPath?: string): ErrorDetailDto[] {
  return errors.flatMap((error) => {
    const field = parentPath ? `${parentPath}.${error.property}` : error.property;
    const ownDetails = Object.keys(error.constraints ?? {})
      .sort()
      .map((constraint) => ({
        field,
        reason: reasonByConstraint[constraint] ?? normalizeConstraintName(constraint),
      }));
    const childDetails = validationDetails(error.children ?? [], field);

    return [...ownDetails, ...childDetails];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    exceptionFactory: (errors: ValidationError[]) =>
      new ApplicationException({
        code: 'VALIDATION_ERROR',
        details: validationDetails(errors),
        message: 'Dados inválidos.',
        statusCode: HttpStatus.BAD_REQUEST,
      }),
    forbidNonWhitelisted: true,
    transform: true,
    whitelist: true,
  });
}
