import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { EngagementController } from '@api/modules/engagement/controllers/engagement.controller';
import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';
import { ListBookmarksQueryDto } from '@api/modules/engagement/dto/query/list-bookmarks-query.dto';
import { SetReactionDto } from '@api/modules/engagement/dto/request/set-reaction.dto';
import { BookmarksService } from '@api/modules/engagement/services/bookmarks.service';
import { ReactionsService } from '@api/modules/engagement/services/reactions.service';

describe('DTOs e OpenAPI de Engagement', () => {
  it('aceita apenas tipos de reação definidos pelo domínio', async () => {
    const valid = plainToInstance(SetReactionDto, { type: ReactionType.DISLIKE });
    const invalid = plainToInstance(SetReactionDto, { type: 'LOVE' });

    await expect(validate(valid)).resolves.toHaveLength(0);
    await expect(validate(invalid)).resolves.toHaveLength(1);
  });

  it('aplica a paginação 12/24 da biblioteca privada', async () => {
    const defaults = plainToInstance(ListBookmarksQueryDto, {});
    const maximum = plainToInstance(ListBookmarksQueryDto, { limit: '24', page: '2' });
    const invalid = plainToInstance(ListBookmarksQueryDto, { limit: '25', page: '0' });

    await expect(validate(defaults)).resolves.toHaveLength(0);
    expect(defaults).toMatchObject({ limit: 12, page: 1 });
    await expect(validate(maximum)).resolves.toHaveLength(0);
    expect(maximum).toMatchObject({ limit: 24, page: 2 });
    await expect(validate(invalid)).resolves.toHaveLength(2);
  });

  it('publica autenticação, DTOs e status idempotentes no OpenAPI', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EngagementController],
      providers: [
        { provide: ReactionsService, useValue: {} },
        { provide: BookmarksService, useValue: {} },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Test')
        .setVersion('1')
        .addBearerAuth({ bearerFormat: 'JWT', scheme: 'bearer', type: 'http' }, 'supabase-jwt')
        .build(),
    );

    expect(document.components?.schemas?.['SetReactionDto']).toBeDefined();
    expect(document.components?.schemas?.['ReactionResponseDto']).toBeDefined();
    expect(document.components?.schemas?.['BookmarkResponseDto']).toBeDefined();
    expect(document.paths?.['/posts/{id}/reaction']?.put?.responses?.['200']).toBeDefined();
    expect(document.paths?.['/posts/{id}/reaction']?.delete?.responses?.['204']).toBeDefined();
    expect(document.paths?.['/posts/{id}/bookmark']?.delete?.responses?.['204']).toBeDefined();
    const parameters = document.paths?.['/bookmarks']?.get?.parameters ?? [];
    const pageParameter = parameters.find(
      (parameter) => 'name' in parameter && parameter.name === 'page',
    );
    const limitParameter = parameters.find(
      (parameter) => 'name' in parameter && parameter.name === 'limit',
    );

    expect(pageParameter).toMatchObject({ in: 'query' });
    expect(limitParameter).toMatchObject({ in: 'query', schema: { maximum: 24 } });
    expect(document.paths?.['/bookmarks']?.get?.security).toContainEqual({
      'supabase-jwt': [],
    });

    await app.close();
  });
});
