import { HttpStatus } from '@nestjs/common';

import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import { CommentAlreadyDeletedError } from '@api/modules/comments/domain/errors/comment-already-deleted.error';
import { CommentContentInvalidError } from '@api/modules/comments/domain/errors/comment-content-invalid.error';
import { CommentEditNotAllowedError } from '@api/modules/comments/domain/errors/comment-edit-not-allowed.error';
import { CommentNestingLimitExceededError } from '@api/modules/comments/domain/errors/comment-nesting-limit-exceeded.error';
import { CommentParentInvalidError } from '@api/modules/comments/domain/errors/comment-parent-invalid.error';
import { InvalidCommentStatusTransitionError } from '@api/modules/comments/domain/errors/invalid-comment-status-transition.error';
import { PostNotOpenForCommentsError } from '@api/modules/comments/domain/errors/post-not-open-for-comments.error';

function applicationException(
  error: Error & { code: string },
  message: string,
  statusCode: HttpStatus,
): ApplicationException {
  return new ApplicationException({ cause: error, code: error.code, message, statusCode });
}

export function throwCommentDomainException(error: unknown): never {
  if (error instanceof CommentContentInvalidError) {
    throw applicationException(
      error,
      'O conteúdo do comentário é inválido.',
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
  if (error instanceof CommentParentInvalidError) {
    throw applicationException(error, 'O comentário pai é inválido.', HttpStatus.CONFLICT);
  }
  if (error instanceof CommentNestingLimitExceededError) {
    throw applicationException(
      error,
      'Comentários aceitam somente uma camada de respostas.',
      HttpStatus.CONFLICT,
    );
  }
  if (error instanceof PostNotOpenForCommentsError) {
    throw applicationException(
      error,
      'Post não encontrado ou indisponível para comentários.',
      HttpStatus.NOT_FOUND,
    );
  }
  if (
    error instanceof CommentAlreadyDeletedError ||
    error instanceof CommentEditNotAllowedError ||
    error instanceof InvalidCommentStatusTransitionError
  ) {
    throw applicationException(
      error,
      'O estado atual do comentário não permite esta ação.',
      HttpStatus.CONFLICT,
    );
  }

  throw error;
}
