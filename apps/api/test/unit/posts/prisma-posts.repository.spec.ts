import type { PrismaService } from '@api/core/database/prisma.service';
import { PrismaPostsRepository } from '@api/modules/posts/repositories/prisma-posts.repository';

describe('ordenação pública no repositório', () => {
  it.each([
    ['recent', { publishedAt: 'desc' }],
    ['oldest', { publishedAt: 'asc' }],
    ['popular', { viewsCount: 'desc' }],
    ['least-viewed', { viewsCount: 'asc' }],
  ] as const)('aplica %s com desempate, paginação e filtro', async (sort, order) => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      post: { count: jest.fn().mockResolvedValue(0), findMany },
      $transaction: (queries: Promise<unknown>[]) => Promise.all(queries),
    } as unknown as PrismaService;
    const repository = new PrismaPostsRepository(prisma);
    await repository.listPublic({ limit: 12, page: 2, sort, tag: 'typescript' });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [order, { id: 'asc' }],
        skip: 12,
        take: 12,
        where: { status: 'PUBLISHED', tags: { some: { tag: { slug: 'typescript' } } } },
      }),
    );
  });
});
