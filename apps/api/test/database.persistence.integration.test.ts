import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient, UserRole } from '@api/generated/prisma/client';

import { requireIntegrationDatabaseUrl } from './integration/database-url';

const connectionString = requireIntegrationDatabaseUrl();
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

describe('Persistência PostgreSQL', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('executa sobre um banco com a migration inicial aplicada', async () => {
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
    `;

    expect(migrations.map(({ migration_name: migrationName }) => migrationName)).toContain(
      '20260810190000_initial_schema',
    );
  });

  it('persiste, consulta e remove um perfil de integração', async () => {
    const profileId = randomUUID();
    let databaseWasCleaned = false;

    try {
      await prisma.profile.create({
        data: {
          displayName: 'Perfil temporário da CI',
          id: profileId,
          role: UserRole.USER,
        },
      });

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
});
