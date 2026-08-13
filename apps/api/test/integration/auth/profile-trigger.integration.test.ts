import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, UserRole } from '@api/generated/prisma/client';

import { requireIntegrationDatabaseUrl } from '../../helpers/database-url';

const connectionString = requireIntegrationDatabaseUrl();
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const authUserIds: string[] = [];
const profileIds: string[] = [];

async function insertAuthUser(id: string, rawUserMetadata: Record<string, unknown>): Promise<void> {
  authUserIds.push(id);

  await prisma.$executeRaw`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (
      ${id}::UUID,
      ${`integration+${id}@example.com`},
      ${JSON.stringify(rawUserMetadata)}::JSONB
    )
  `;
}

describe('Trigger de Profile para novos usuários do Supabase Auth', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    for (const id of authUserIds.splice(0)) {
      await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${id}::UUID`;
    }

    await prisma.profile.deleteMany({
      where: { id: { in: profileIds.splice(0) } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cria Profile USER e copia somente um display name textual normalizado', async () => {
    const userId = randomUUID();
    profileIds.push(userId);

    await insertAuthUser(userId, {
      display_name: '  Ana\n   Maria\t ',
      role: 'ADMIN',
    });

    await expect(
      prisma.profile.findUniqueOrThrow({ where: { id: userId } }),
    ).resolves.toMatchObject({
      displayName: 'Ana Maria',
      id: userId,
      role: UserRole.USER,
    });
  });

  it('limita o display name e usa fallback quando o metadata não contém texto válido', async () => {
    const longNameUserId = randomUUID();
    const fallbackUserId = randomUUID();
    profileIds.push(longNameUserId, fallbackUserId);

    await insertAuthUser(longNameUserId, { display_name: 'A'.repeat(140) });
    await insertAuthUser(fallbackUserId, { display_name: { value: 'Nome inválido' } });

    const [longNameProfile, fallbackProfile] = await Promise.all([
      prisma.profile.findUniqueOrThrow({ where: { id: longNameUserId } }),
      prisma.profile.findUniqueOrThrow({ where: { id: fallbackUserId } }),
    ]);

    expect(longNameProfile.displayName).toHaveLength(120);
    expect(fallbackProfile.displayName).toBe('Leitor');
  });

  it('desfaz o cadastro em auth.users quando a criação do Profile falha', async () => {
    const userId = randomUUID();
    profileIds.push(userId);

    await prisma.profile.create({
      data: {
        displayName: 'Profile conflitante',
        id: userId,
      },
    });

    await expect(insertAuthUser(userId, { display_name: 'Novo leitor' })).rejects.toThrow();

    const authUserCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::BIGINT AS count
      FROM auth.users
      WHERE id = ${userId}::UUID
    `;

    expect(authUserCount[0]?.count).toBe(0n);
  });
});
