import { Controller, Post as PostRoute } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiBody, ApiOkResponse, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { PostStatus } from '@api/modules/posts/domain/enums/post-status.enum';
import { ListAdminPostsQueryDto } from '@api/modules/posts/dto/query/list-admin-posts-query.dto';
import {
  ListPublicPostsQueryDto,
  PublicPostsSort,
} from '@api/modules/posts/dto/query/list-public-posts-query.dto';
import { SearchPostsQueryDto } from '@api/modules/posts/dto/query/search-posts-query.dto';
import { CreatePostDto } from '@api/modules/posts/dto/request/create-post.dto';
import { UpdatePostDto } from '@api/modules/posts/dto/request/update-post.dto';
import { PostAdminDetailDto } from '@api/modules/posts/dto/response/post-admin-response.dto';

@Controller('_post-contracts')
class PostContractsController {
  @PostRoute()
  @ApiBody({ type: UpdatePostDto })
  @ApiOkResponse({ type: PostAdminDetailDto })
  save(): PostAdminDetailDto {
    return new PostAdminDetailDto();
  }
}

describe('DTOs de posts', () => {
  it.each(Object.values(PublicPostsSort))('aceita ordenação pública %s', async (sort) => {
    await expect(
      validate(plainToInstance(ListPublicPostsQueryDto, { sort })),
    ).resolves.toHaveLength(0);
  });

  it('rejeita ordenação desconhecida', async () => {
    await expect(
      validate(plainToInstance(ListPublicPostsQueryDto, { sort: 'unknown' })),
    ).resolves.not.toHaveLength(0);
  });
  it('transforma e valida a paginação pública', async () => {
    const query = plainToInstance(ListPublicPostsQueryDto, {
      limit: '24',
      page: '2',
      tag: '  TypeScript  ',
    });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query).toMatchObject({
      limit: 24,
      page: 2,
      sort: PublicPostsSort.RECENT,
      tag: 'typescript',
    });
  });

  it('rejeita limites públicos acima do contrato', async () => {
    const query = plainToInstance(ListPublicPostsQueryDto, { limit: '25', page: '0' });

    await expect(validate(query)).resolves.toHaveLength(2);
  });

  it('rejeita filtro de tag vazio', async () => {
    const query = plainToInstance(ListPublicPostsQueryDto, { tag: '   ' });

    await expect(validate(query)).resolves.not.toHaveLength(0);
  });

  it('valida filtros e limite da listagem administrativa', async () => {
    const validQuery = plainToInstance(ListAdminPostsQueryDto, {
      limit: '100',
      q: '  domínio   editorial ',
      status: PostStatus.DRAFT,
    });
    const invalidQuery = plainToInstance(ListAdminPostsQueryDto, {
      limit: '101',
      status: 'INVALID',
    });

    await expect(validate(validQuery)).resolves.toHaveLength(0);
    expect(validQuery).toMatchObject({ limit: 100, q: 'domínio editorial' });
    await expect(validate(invalidQuery)).resolves.toHaveLength(2);
  });

  it('rejeita busca vazia após normalização', async () => {
    const query = plainToInstance(SearchPostsQueryDto, { q: '   ' });

    expect(query.q).toBe('');
    await expect(validate(query)).resolves.not.toHaveLength(0);
  });

  it('normaliza caixa, Unicode e espaços do termo de busca', async () => {
    const query = plainToInstance(SearchPostsQueryDto, { q: '  NESTJS   E   AÇÃO  ' });

    await expect(validate(query)).resolves.toHaveLength(0);
    expect(query.q).toBe('nestjs e ação');
  });

  it('normaliza o título inicial sem exigir dados completos de publicação', async () => {
    const request = plainToInstance(CreatePostDto, {
      title: '  Meu   rascunho  ',
    });

    await expect(validate(request)).resolves.toHaveLength(0);
    expect(request.title).toBe('Meu rascunho');
  });

  it('valida limites, UUID e tags do update', async () => {
    const request = plainToInstance(UpdatePostDto, {
      coverMediaId: 'not-a-uuid',
      seoDescription: 'a'.repeat(161),
      tagNames: ['NestJS', ' nestjs '],
      title: 'a'.repeat(201),
    });

    await expect(validate(request)).resolves.toHaveLength(4);
  });

  it('rejeita slug e nome de tag vazios', async () => {
    const request = plainToInstance(UpdatePostDto, {
      slug: '',
      tagNames: [''],
    });

    await expect(validate(request)).resolves.toHaveLength(2);
  });

  it('publica os contratos de request e response no OpenAPI', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PostContractsController],
    }).compile();
    const app = moduleRef.createNestApplication();

    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Test').setVersion('1').build(),
    );

    expect(document.components?.schemas?.['PostAdminDetailDto']).toBeDefined();
    expect(document.components?.schemas?.['UpdatePostDto']).toBeDefined();

    await app.close();
  });
});
