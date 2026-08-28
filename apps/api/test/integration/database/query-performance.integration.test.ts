import type { PrismaService } from '@api/core/database/prisma.service';
import { Prisma } from '@api/generated/prisma/client';

import { createIntegrationPrisma } from '../../helpers/integration-prisma';

const LOCAL_QUERY_BUDGET_MS = 100;
const REFERENCE_ID = '00000000-0000-4000-8000-000000000001';
const EXPECTED_INDEXES = [
  'Post_status_publishedAt_id_idx',
  'Post_status_viewsCount_id_idx',
  'Post_updatedAt_id_idx',
  'Post_status_updatedAt_id_idx',
  'Comment_postId_parentId_createdAt_id_idx',
  'Comment_createdAt_id_idx',
  'Comment_postId_createdAt_id_idx',
  'Comment_status_createdAt_id_idx',
  'Bookmark_profileId_createdAt_id_idx',
  'MediaAsset_status_createdAt_id_idx',
  'MediaAsset_status_orphanedAt_id_idx',
  'NewsletterSubscriber_status_createdAt_id_idx',
  'EmailCampaign_createdAt_id_idx',
  'EmailCampaign_status_createdAt_id_idx',
] as const;

interface ExplainDocument {
  'Execution Time': number;
  Plan: unknown;
}

interface ExplainResult {
  'QUERY PLAN': ExplainDocument[];
}

const criticalQueries = [
  {
    indexes: ['Post_status_publishedAt_id_idx'],
    name: 'listagem pública recente de posts',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Post"
      WHERE "status" = 'PUBLISHED'::"PostStatus"
      ORDER BY "publishedAt" DESC, "id" ASC
      LIMIT 24
    `,
  },
  {
    indexes: ['Post_status_viewsCount_id_idx'],
    name: 'ranking público de posts',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Post"
      WHERE "status" = 'PUBLISHED'::"PostStatus"
      ORDER BY "viewsCount" DESC, "id" ASC
      LIMIT 24
    `,
  },
  {
    indexes: ['Post_updatedAt_id_idx'],
    name: 'listagem administrativa de posts',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Post"
      ORDER BY "updatedAt" DESC, "id" ASC
      LIMIT 100
    `,
  },
  {
    indexes: ['Post_status_updatedAt_id_idx'],
    name: 'listagem administrativa de posts por status',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Post"
      WHERE "status" = 'DRAFT'::"PostStatus"
      ORDER BY "updatedAt" DESC, "id" ASC
      LIMIT 100
    `,
  },
  {
    indexes: ['Comment_postId_parentId_createdAt_id_idx', 'Comment_postId_createdAt_id_idx'],
    name: 'threads públicas de comentários',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Comment"
      WHERE "postId" = ${REFERENCE_ID}::uuid AND "parentId" IS NULL
      ORDER BY "createdAt" ASC, "id" ASC
      LIMIT 50
    `,
  },
  {
    indexes: ['Comment_status_createdAt_id_idx'],
    name: 'moderação de comentários por status',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Comment"
      WHERE "status" = 'SPAM'::"CommentStatus"
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT 100
    `,
  },
  {
    indexes: ['Comment_createdAt_id_idx'],
    name: 'moderação geral de comentários',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Comment"
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT 100
    `,
  },
  {
    indexes: ['Comment_postId_createdAt_id_idx'],
    name: 'moderação de comentários por post',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Comment"
      WHERE "postId" = ${REFERENCE_ID}::uuid
      ORDER BY "createdAt" DESC, "id" DESC
      LIMIT 100
    `,
  },
  {
    indexes: ['Bookmark_profileId_createdAt_id_idx'],
    name: 'biblioteca privada de bookmarks',
    statement: Prisma.sql`
      SELECT "id"
      FROM "Bookmark"
      WHERE "profileId" = ${REFERENCE_ID}::uuid
      ORDER BY "createdAt" DESC, "id" ASC
      LIMIT 24
    `,
  },
  {
    indexes: ['MediaAsset_status_createdAt_id_idx'],
    name: 'seleção de mídias prontas sem referência',
    statement: Prisma.sql`
      SELECT "id"
      FROM "MediaAsset" AS media
      WHERE media."status" = 'READY'::"MediaAssetStatus"
        AND media."createdAt" <= NOW()
        AND NOT EXISTS (
          SELECT 1
          FROM "PostMediaAsset" AS reference
          WHERE reference."mediaAssetId" = media."id"
        )
      ORDER BY media."createdAt" ASC, media."id" ASC
      LIMIT 500
    `,
  },
  {
    indexes: ['MediaAsset_status_orphanedAt_id_idx'],
    name: 'seleção de mídias órfãs expiradas',
    statement: Prisma.sql`
      SELECT "id"
      FROM "MediaAsset"
      WHERE "status" = 'ORPHANED'::"MediaAssetStatus" AND "orphanedAt" <= NOW()
      ORDER BY "orphanedAt" ASC, "id" ASC
      LIMIT 500
    `,
  },
  {
    indexes: ['NewsletterSubscriber_status_createdAt_id_idx'],
    name: 'audiência elegível da newsletter',
    statement: Prisma.sql`
      SELECT "id"
      FROM "NewsletterSubscriber"
      WHERE "status" = 'CONFIRMED'::"SubscriberStatus"
      ORDER BY "createdAt" ASC, "id" ASC
    `,
  },
  {
    indexes: ['EmailCampaign_status_createdAt_id_idx'],
    name: 'listagem administrativa de campanhas por status',
    statement: Prisma.sql`
      SELECT "id"
      FROM "EmailCampaign"
      WHERE "status" = 'DRAFT'::"CampaignStatus"
      ORDER BY "createdAt" DESC, "id" ASC
      LIMIT 100
    `,
  },
  {
    indexes: ['EmailCampaign_createdAt_id_idx'],
    name: 'listagem administrativa geral de campanhas',
    statement: Prisma.sql`
      SELECT "id"
      FROM "EmailCampaign"
      ORDER BY "createdAt" DESC, "id" ASC
      LIMIT 100
    `,
  },
] as const;

function explainDocument(result: ExplainResult[]): ExplainDocument {
  const document = result[0]?.['QUERY PLAN']?.[0];

  if (!document) throw new Error('PostgreSQL não retornou o plano esperado.');
  return document;
}

describe('Performance das queries críticas com PostgreSQL real', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = createIntegrationPrisma();
    await prisma.onModuleInit();
    await prisma.$executeRawUnsafe(
      'ANALYZE "Post", "Comment", "Bookmark", "MediaAsset", "NewsletterSubscriber", "EmailCampaign"',
    );
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it('mantém todos os índices críticos disponíveis', async () => {
    const records = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    const availableIndexes = new Set(records.map(({ indexname }) => indexname));

    for (const index of EXPECTED_INDEXES) expect(availableIndexes.has(index)).toBe(true);
  });

  it.each(criticalQueries)(
    'usa um índice compatível em $name dentro da meta local',
    async ({ indexes, statement }) => {
      const result = await prisma.$transaction(async (transaction) => {
        await transaction.$executeRaw`SET LOCAL enable_seqscan = off`;

        return transaction.$queryRaw<ExplainResult[]>(
          Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${statement}`,
        );
      });
      const document = explainDocument(result);
      const serializedPlan = JSON.stringify(document.Plan);

      expect(indexes.some((index) => serializedPlan.includes(index))).toBe(true);
      expect(document['Execution Time']).toBeLessThanOrEqual(LOCAL_QUERY_BUDGET_MS);
    },
  );
});
