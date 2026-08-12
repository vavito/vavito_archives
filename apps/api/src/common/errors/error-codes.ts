import { HttpStatus } from '@nestjs/common';

export const errorCodesByStatus: Readonly<Partial<Record<number, string>>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'ROUTE_NOT_FOUND',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'METHOD_NOT_ALLOWED',
  [HttpStatus.NOT_ACCEPTABLE]: 'NOT_ACCEPTABLE',
  [HttpStatus.REQUEST_TIMEOUT]: 'REQUEST_TIMEOUT',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.GONE]: 'GONE',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'PAYLOAD_TOO_LARGE',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMIT_EXCEEDED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.NOT_IMPLEMENTED]: 'INTERNAL_ERROR',
  [HttpStatus.BAD_GATEWAY]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.GATEWAY_TIMEOUT]: 'SERVICE_UNAVAILABLE',
};

export function errorCodeForStatus(statusCode: number): string {
  return errorCodesByStatus[statusCode] ?? 'HTTP_ERROR';
}
