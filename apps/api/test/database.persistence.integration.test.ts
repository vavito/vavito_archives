import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, UserRole } from '@api/generated/prisma/client';

import { requireIntegrationDatabaseUrl } from './integration/database-url';

const connectionString = requireIntegrationDatabaseUrl();
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const expectedApplicationTables = [
  'Bookmark',
  'Comment',
  'ContactMessage',
  'EmailCampaign',
  'EmailDelivery',
  'MediaAsset',
  'NewsletterSubscriber',
  'Post',
  'PostMediaAsset',
  'PostRevision',
  'PostSlug',
  'PostTag',
  'PostView',
  'Profile',
  'Reaction',
  'Tag',
  'WebhookEvent',
];

interface TestRecords {
  postIds: string[];
  profileIds: string[];
  tagIds: string[];
}

let records: TestRecords;

async function createProfile(): Promise<string> {
  const id = randomUUID();

  await prisma.profile.create({
    data: {
      displayName: 'Perfil temporário da CI',
      id,
      role: UserRole.USER,
    },
  });
  records.profileIds.push(id);

  return id;
}

async function createPost(authorId: string, content: object = { type: 'doc' }): Promise<string> {
  const id = randomUUID();

  await prisma.post.create({
    data: {
      authorId,
      content,
      id,
      title: 'Post temporário da CI',
    },
  });
  records.postIds.push(id);

  return id;
}

describe('Persistência PostgreSQL', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(() => {
    records = { postIds: [], profileIds: [], tagIds: [] };
  });

  afterEach(async () => {
    await prisma.post.deleteMany({ where: { id: { in: records.postIds } } });
    await prisma.tag.deleteMany({ where: { id: { in: records.tagIds } } });
    await prisma.profile.deleteMany({ where: { id: { in: records.profileIds } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('executa sobre um banco criado integralmente pela migration inicial', async () => {
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
    `;
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name
    `;
    const checkConstraints = await prisma.$queryRaw<Array<{ constraint_name: string }>>`
      SELECT con.conname AS constraint_name
      FROM pg_constraint con
      INNER JOIN pg_namespace namespace ON namespace.oid = con.connamespace
      WHERE con.contype = 'c'
        AND namespace.nspname = 'public'
    `;

    expect(migrations.map(({ migration_name: migrationName }) => migrationName)).toContain(
      '20260810190000_initial_schema',
    );
    expect(tables.map(({ table_name: tableName }) => tableName)).toEqual(expectedApplicationTables);
    expect(checkConstraints).toHaveLength(14);
  });

  it('persiste, consulta e remove um perfil de integração', async () => {
    const profileId = await createProfile();
    let databaseWasCleaned = false;

    try {
      const persistedProfile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      expect(persistedProfile).toMatchObject({
        displayName: 'Perfil temporário da CI',
        id: profileId,
        role: UserRole.USER,
      });
    } finally {
      await prisma.profile.deleteMany({ where: { id: profileId } });
      databaseWasCleaned = (await prisma.profile.count({ where: { id: profileId } })) === 0;
    }

    expect(databaseWasCleaned).toBe(true);
  });

  it('rejeita violações de unicidade simples e composta', async () => {
    const authorId = await createProfile();
    const postId = await createPost(authorId);
    const tagId = randomUUID();

    await prisma.tag.create({
      data: { id: tagId, name: `tag-${tagId}`, slug: 'slug-unico-da-ci' },
    });
    records.tagIds.push(tagId);
    await prisma.reaction.create({
      data: { postId, profileId: authorId, type: 'LIKE' },
    });

    await expect(
      prisma.tag.create({
        data: { name: `outra-tag-${tagId}`, slug: 'slug-unico-da-ci' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
    await expect(
      prisma.reaction.create({
        data: { postId, profileId: authorId, type: 'DISLIKE' },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('rejeita FK inválida e respeita RESTRICT e CASCADE', async () => {
    const authorId = await createProfile();
    const postId = await createPost(authorId);
    const slugId = randomUUID();

    await expect(createPost(randomUUID())).rejects.toMatchObject({ code: 'P2003' });

    await prisma.postSlug.create({
      data: { id: slugId, postId, slug: `post-${postId}` },
    });

    await expect(prisma.profile.delete({ where: { id: authorId } })).rejects.toMatchObject({
      code: 'P2003',
    });

    await prisma.post.delete({ where: { id: postId } });

    expect(await prisma.postSlug.count({ where: { id: slugId } })).toBe(0);
    expect(await prisma.profile.count({ where: { id: authorId } })).toBe(1);
  });

  it('aplica check constraints definidas pela migration', async () => {
    const authorId = await createProfile();

    await expect(
      prisma.post.create({
        data: {
          authorId,
          content: { type: 'doc' },
          readingTimeMinutes: -1,
          title: 'Post inválido',
        },
      }),
    ).rejects.toMatchObject({ code: 'P2039' });
  });

  it('preserva um documento JSONB completo no round-trip', async () => {
    const authorId = await createProfile();
    const content = {
      content: [
        {
          attrs: { level: 2 },
          content: [{ marks: [{ type: 'bold' }], text: 'Título', type: 'text' }],
          type: 'heading',
        },
        {
          content: [{ text: 'Conteúdo com acentuação.', type: 'text' }],
          type: 'paragraph',
        },
      ],
      metadata: { featured: true, readingOrder: [1, 2], version: 1 },
      type: 'doc',
    };
    const postId = await createPost(authorId, content);
    const persistedPost = await prisma.post.findUniqueOrThrow({
      select: { content: true },
      where: { id: postId },
    });

    expect(persistedPost.content).toEqual(content);
  });
});
