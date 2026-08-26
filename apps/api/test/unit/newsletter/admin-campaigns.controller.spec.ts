import { ROLES_METADATA_KEY } from '@api/core/auth/constants/auth.constants';
import { UserRole } from '@api/generated/prisma/client';
import { AdminCampaignsController } from '@api/modules/newsletter/controllers/admin-campaigns.controller';
import { CampaignsService } from '@api/modules/newsletter/services/campaigns.service';
import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('AdminCampaignsController', () => {
  const create = jest.fn();
  const get = jest.fn();
  const list = jest.fn();
  const send = jest.fn();
  const update = jest.fn();
  const service = { create, get, list, send, update } as unknown as CampaignsService;
  const user = { email: 'admin@example.com', id: '501b31f5-9918-4614-a38e-fb307406be88' };

  beforeEach(() => jest.clearAllMocks());

  it('restringe o controller a ADMIN e declara envio 202', () => {
    expect(Reflect.getMetadata(ROLES_METADATA_KEY, AdminCampaignsController)).toEqual([
      UserRole.ADMIN,
    ]);
    expect(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      Reflect.getMetadata(HTTP_CODE_METADATA, AdminCampaignsController.prototype.send),
    ).toBe(HttpStatus.ACCEPTED);
  });

  it('delega criação, preview, edição e envio ao service', async () => {
    const controller = new AdminCampaignsController(service);
    const campaignId = '0b68ee40-f392-49cb-95c4-dd19cdd1bd43';
    const idempotencyKey = 'e1903668-2b3e-4df8-b945-eddb4ef53f90';
    const createDto = {
      postId: 'bbd448e1-20bf-4fb3-aa26-f1ff9e7194f6',
      subject: 'Novo artigo',
    };
    const updateDto = { previewText: 'Novo preview' };
    create.mockResolvedValueOnce({ id: campaignId });
    get.mockResolvedValueOnce({ id: campaignId });
    update.mockResolvedValueOnce({ id: campaignId });
    send.mockResolvedValueOnce({ id: campaignId });

    await controller.create(user, createDto);
    await controller.get(user, campaignId);
    await controller.update(user, campaignId, updateDto);
    await controller.send(user, campaignId, idempotencyKey);

    expect(create).toHaveBeenCalledWith(user.id, createDto);
    expect(get).toHaveBeenCalledWith(user.id, campaignId);
    expect(update).toHaveBeenCalledWith(user.id, campaignId, updateDto);
    expect(send).toHaveBeenCalledWith(user.id, campaignId, idempotencyKey);
  });

  it('publica contratos e Idempotency-Key no OpenAPI', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AdminCampaignsController],
      providers: [{ provide: CampaignsService, useValue: service }],
    }).compile();
    const app = moduleRef.createNestApplication();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test').setVersion('1').build(),
    );
    const sendOperation = document.paths?.['/admin/newsletter/campaigns/{id}/send']?.post;

    expect(document.components?.schemas?.['CreateCampaignDto']).toBeDefined();
    expect(document.components?.schemas?.['EmailCampaignAdminDto']).toBeDefined();
    expect(sendOperation?.responses?.['202']).toBeDefined();
    expect(sendOperation?.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ in: 'header', name: 'Idempotency-Key' })]),
    );

    await app.close();
  });
});
