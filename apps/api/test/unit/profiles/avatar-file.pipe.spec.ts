import { ApplicationException } from '@api/core/http/exceptions/application.exception';
import {
  AvatarFilePipe,
  MAX_AVATAR_SIZE_BYTES,
} from '@api/modules/profiles/pipes/avatar-file.pipe';

function uploadedFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

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

  it('aceita PNG válido e normaliza os dados para o Storage', () => {
    expect(pipe.transform(uploadedFile())).toMatchObject({
      contentType: 'image/png',
      extension: 'png',
    });
  });

  it('rejeita conteúdo que não corresponde ao MIME type', () => {
    expect(() => pipe.transform(uploadedFile({ buffer: Buffer.from('not an image') }))).toThrow(
      ApplicationException,
    );
  });

  it('rejeita arquivo acima de 2 MB', () => {
    expect(() => pipe.transform(uploadedFile({ size: MAX_AVATAR_SIZE_BYTES + 1 }))).toThrow(
      ApplicationException,
    );
  });
});
