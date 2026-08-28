import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
  ListAdminCommentsQueryDto,
  ListCommentsQueryDto,
} from '@api/modules/comments/dto/query/list-comments-query.dto';
import { ListBookmarksQueryDto } from '@api/modules/engagement/dto/query/list-bookmarks-query.dto';
import { ListCampaignsQueryDto } from '@api/modules/newsletter/dto/query/list-campaigns-query.dto';
import { ListAdminPostsQueryDto } from '@api/modules/posts/dto/query/list-admin-posts-query.dto';
import { ListPublicPostsQueryDto } from '@api/modules/posts/dto/query/list-public-posts-query.dto';
import { POST_SEARCH_MAX_RESULTS } from '@api/modules/posts/dto/query/search-posts-query.dto';

describe('Limites máximos de leitura', () => {
  it.each([
    ['posts públicos', ListPublicPostsQueryDto, 24],
    ['bookmarks', ListBookmarksQueryDto, 24],
    ['comentários públicos', ListCommentsQueryDto, 50],
    ['posts administrativos', ListAdminPostsQueryDto, 100],
    ['comentários administrativos', ListAdminCommentsQueryDto, 100],
    ['campanhas administrativas', ListCampaignsQueryDto, 100],
  ] as const)('aceita o máximo de %s e rejeita valores superiores', async (_name, Dto, maximum) => {
    const accepted = plainToInstance(Dto, { limit: String(maximum) });
    const rejected = plainToInstance(Dto, { limit: String(maximum + 1) });

    await expect(validate(accepted)).resolves.toHaveLength(0);
    await expect(validate(rejected)).resolves.not.toHaveLength(0);
  });

  it('mantém a busca instantânea limitada a oito resultados', () => {
    expect(POST_SEARCH_MAX_RESULTS).toBe(8);
  });
});
