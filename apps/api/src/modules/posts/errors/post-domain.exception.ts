import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { InvalidPostStatusTransitionError } from '@api/modules/posts/domain/errors/invalid-post-status-transition.error';
import { PostContentInvalidError } from '@api/modules/posts/domain/errors/post-content-invalid.error';
import { PostDeleteNotAllowedError } from '@api/modules/posts/domain/errors/post-delete-not-allowed.error';
import { PostEditNotAllowedError } from '@api/modules/posts/domain/errors/post-edit-not-allowed.error';
import { PostNotReadyForPublicationError } from '@api/modules/posts/domain/errors/post-not-ready-for-publication.error';
import { PostSlugInvalidError } from '@api/modules/posts/domain/errors/post-slug-invalid.error';

export function throwPostDomainException(error: unknown): never {
  if (error instanceof PostNotReadyForPublicationError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      details: error.missingFields.map((field) => ({
        field,
        reason: 'REQUIRED_FOR_PUBLICATION',
      })),
      message: 'O post ainda não possui todos os campos necessários para publicação.',
      statusCode: HttpStatus.CONFLICT,
    });
  }

  if (error instanceof InvalidPostStatusTransitionError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'O estado atual do post não permite esta ação.',
      statusCode: HttpStatus.CONFLICT,
    });
  }

  if (error instanceof PostEditNotAllowedError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'Posts arquivados não podem ser editados.',
      statusCode: HttpStatus.CONFLICT,
    });
  }

  if (error instanceof PostDeleteNotAllowedError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'Posts publicados não podem ser excluídos permanentemente.',
      statusCode: HttpStatus.CONFLICT,
    });
  }

  if (error instanceof PostContentInvalidError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'O conteúdo do post é inválido.',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  }

  if (error instanceof PostSlugInvalidError) {
    throw new ApplicationException({
      cause: error,
      code: error.code,
      message: 'O slug do post é inválido.',
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  }

  throw error;
}
