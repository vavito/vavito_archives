import { extname } from 'node:path';

import { Injectable, type PipeTransform } from '@nestjs/common';
import sharp from 'sharp';

import {
  MAX_MEDIA_SIZE_BYTES,
  MEDIA_EXTENSIONS_BY_MIME_TYPE,
  type SupportedMediaMimeType,
} from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import { MediaFileRequiredException } from '@api/modules/media/errors/media-file-required.exception';
import { MediaFileTooLargeException } from '@api/modules/media/errors/media-file-too-large.exception';
import { MediaFileUnsupportedException } from '@api/modules/media/errors/media-file-unsupported.exception';

export interface ValidatedMediaUpload {
  buffer: Buffer;
  extension: string;
  height: number;
  mimeType: SupportedMediaMimeType;
  width: number;
}

const mimeTypeByFormat = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

function normalizedExtension(filename: string): string {
  return extname(filename).slice(1).trim().toLowerCase();
}

@Injectable()
export class MediaFilePipe implements PipeTransform<
  Express.Multer.File | undefined,
  Promise<ValidatedMediaUpload>
> {
  async transform(file: Express.Multer.File | undefined): Promise<ValidatedMediaUpload> {
    if (!file || file.buffer.byteLength === 0) {
      throw new MediaFileRequiredException();
    }

    if (file.buffer.byteLength > MAX_MEDIA_SIZE_BYTES) {
      throw new MediaFileTooLargeException();
    }

    try {
      const metadata = await sharp(file.buffer, { failOn: 'warning' }).metadata();
      const mimeType = mimeTypeByFormat[metadata.format as keyof typeof mimeTypeByFormat];
      const width = metadata.width;
      const height = metadata.height;
      const extension = normalizedExtension(file.originalname);
      const allowedExtensions: readonly string[] = mimeType
        ? MEDIA_EXTENSIONS_BY_MIME_TYPE[mimeType]
        : [];

      if (
        !mimeType ||
        file.mimetype !== mimeType ||
        !allowedExtensions.includes(extension) ||
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        !width ||
        !height ||
        width <= 0 ||
        height <= 0
      ) {
        throw new MediaFileUnsupportedException();
      }

      return {
        buffer: file.buffer,
        extension: mimeType === 'image/jpeg' ? 'jpg' : extension,
        height,
        mimeType,
        width,
      };
    } catch (error) {
      if (error instanceof MediaFileUnsupportedException) {
        throw error;
      }

      throw new MediaFileUnsupportedException();
    }
  }
}
