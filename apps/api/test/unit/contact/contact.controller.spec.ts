import { PUBLIC_ROUTE_METADATA_KEY } from '@api/core/auth/constants/auth.constants';
import { RATE_LIMITS } from '@api/core/http/security/http-security.constants';
import { ContactController } from '@api/modules/contact/controllers/contact.controller';
import { ContactService } from '@api/modules/contact/services/contact.service';
import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { THROTTLER_LIMIT } from '@nestjs/throttler/dist/throttler.constants';

describe('ContactController', () => {
  const create = jest.fn();
  const service = { create } as unknown as ContactService;

  beforeEach(() => jest.clearAllMocks());

  it('declara o endpoint público limitado com status 202', () => {
    expect(Reflect.getMetadata(PUBLIC_ROUTE_METADATA_KEY, ContactController)).toBe(true);
    expect(Reflect.getMetadata(`${THROTTLER_LIMIT}default`, ContactController)).toBe(
      RATE_LIMITS.contact.limit,
    );
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(HTTP_CODE_METADATA, ContactController.prototype.create),
    ).toBe(HttpStatus.ACCEPTED);
  });

  it('delega a mensagem ao service sem acrescentar dados à resposta', async () => {
    const dto = {
      email: 'leitor@example.com',
      message: 'Gostaria de sugerir uma nova pauta.',
      name: 'Leitor',
    };
    create.mockResolvedValueOnce({ message: 'aceito' });

    await expect(new ContactController(service).create(dto)).resolves.toEqual({
      message: 'aceito',
    });
    expect(create).toHaveBeenCalledWith(dto);
  });

  it('publica DTO e respostas no OpenAPI', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [{ provide: ContactService, useValue: service }],
    }).compile();
    const app = moduleRef.createNestApplication();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test').setVersion('1').build(),
    );

    expect(document.components?.schemas?.['CreateContactMessageDto']).toBeDefined();
    expect(document.paths?.['/contact']?.post?.responses?.['202']).toBeDefined();
    expect(document.paths?.['/contact']?.post?.responses?.['429']).toBeDefined();

    await app.close();
  });
});
