import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import sharp from 'sharp';
import {
  AvatarFilePipe,
  MAX_AVATAR_SIZE_BYTES,
} from '@api/modules/profiles/pipes/avatar-file.pipe';

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
    originalname: 'avatar.png',
    path: '',
    size: buffer.length,
    stream: undefined as never,
    ...overrides,
  };
}

describe('AvatarFilePipe', () => {
  const pipe = new AvatarFilePipe();
  let png: Buffer;

  beforeAll(async () => {
    png = await sharp({
      create: { background: '#123456', channels: 3, height: 900, width: 1200 },
    })
      .png()
      .toBuffer();
  });

  it('converte e redimensiona o avatar para WebP antes do armazenamento', async () => {
    const result = await pipe.transform(uploadedFile(png));
    const metadata = await sharp(result.buffer).metadata();

    expect(result).toMatchObject({
      contentType: 'image/webp',
      extension: 'webp',
    });
    expect(metadata).toMatchObject({ format: 'webp', height: 384, width: 512 });
  });

  it('rejeita conteúdo que não corresponde ao MIME type', async () => {
    await expect(pipe.transform(uploadedFile(Buffer.from('not an image')))).rejects.toBeInstanceOf(
      ApplicationException,
    );
  });

  it('rejeita arquivo acima de 2 MB', async () => {
    await expect(
      pipe.transform(uploadedFile(png, { size: MAX_AVATAR_SIZE_BYTES + 1 })),
    ).rejects.toBeInstanceOf(ApplicationException);
  });
});
