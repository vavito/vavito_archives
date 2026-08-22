import { HttpStatus, Injectable, type PipeTransform } from '@nestjs/common';

import type { AvatarUpload } from '@api/core/storage/services/avatar-storage.service';
import { ApplicationException } from '@api/core/http/exceptions/application.exception';

export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

const extensionsByMimeType: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function hasExpectedSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }

  return (
    mimeType === 'image/webp' &&
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

@Injectable()
export class AvatarFilePipe implements PipeTransform<
  Express.Multer.File | undefined,
  AvatarUpload
> {
  transform(file: Express.Multer.File | undefined): AvatarUpload {
    if (!file || file.size === 0) {
      throw new ApplicationException({
        code: 'VALIDATION_ERROR',
        details: [{ field: 'file', reason: 'REQUIRED' }],
        message: 'O arquivo do avatar é obrigatório.',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new ApplicationException({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'O avatar deve ter no máximo 2 MB.',
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      });
    }

    const extension = extensionsByMimeType[file.mimetype];

    if (!extension || !hasExpectedSignature(file.buffer, file.mimetype)) {
      throw new ApplicationException({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Envie uma imagem JPEG, PNG ou WebP válida.',
        statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      });
    }

    return {
      buffer: file.buffer,
      contentType: file.mimetype,
      extension,
    };
  }
}
