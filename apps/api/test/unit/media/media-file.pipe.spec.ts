import sharp from 'sharp';

import { MAX_MEDIA_SIZE_BYTES } from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import { MediaFilePipe } from '@api/modules/media/pipes/media-file.pipe';

function uploadedFile(
  buffer: Buffer,
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    buffer,
    destination: '',
    encoding: '7bit',
    fieldname: 'file',
    filename: '',
    mimetype: 'image/png',
    originalname: 'article.png',
    path: '',
    size: buffer.byteLength,
    stream: undefined as never,
    ...overrides,
  };
}

describe('MediaFilePipe', () => {
  const pipe = new MediaFilePipe();
  let png: Buffer;

  beforeAll(async () => {
    png = await sharp({
      create: { background: '#123456', channels: 3, height: 3, width: 4 },
    })
      .png()
      .toBuffer();
  });

  it('extrai MIME, extensão e dimensões dos bytes da imagem', async () => {
    await expect(pipe.transform(uploadedFile(png))).resolves.toMatchObject({
      extension: 'png',
      height: 3,
      mimeType: 'image/png',
      width: 4,
    });
  });

  it('rejeita MIME declarado diferente do conteúdo real', async () => {
    await expect(
      pipe.transform(uploadedFile(png, { mimetype: 'image/jpeg', originalname: 'article.jpg' })),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE', status: 415 });
  });

  it('rejeita extensão diferente do conteúdo real', async () => {
    await expect(
      pipe.transform(uploadedFile(png, { originalname: 'article.webp' })),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE', status: 415 });
  });

  it('rejeita arquivo corrompido', async () => {
    const invalid = Buffer.from('not an image');

    await expect(pipe.transform(uploadedFile(invalid))).rejects.toMatchObject({
      code: 'UNSUPPORTED_MEDIA_TYPE',
      status: 415,
    });
  });

  it('rejeita arquivo ausente ou vazio', async () => {
    await expect(pipe.transform(undefined)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
    await expect(pipe.transform(uploadedFile(Buffer.alloc(0)))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });
  });

  it('rejeita arquivo acima de 10 MB antes da inspeção', async () => {
    await expect(
      pipe.transform(uploadedFile(Buffer.alloc(MAX_MEDIA_SIZE_BYTES + 1))),
    ).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE', status: 413 });
  });
});
