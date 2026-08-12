import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnvironment } from 'dotenv';

import { PrismaClient, UserRole } from '../src/generated/prisma/client';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class SeedConfigurationError extends Error {}

function loadWorkspaceEnvironment(): void {
  const workingDirectory = process.cwd();
  const workspaceRootCandidate = resolve(workingDirectory, '../..');
  const workspaceRoot = existsSync(resolve(workingDirectory, 'pnpm-workspace.yaml'))
    ? workingDirectory
    : existsSync(resolve(workspaceRootCandidate, 'pnpm-workspace.yaml'))
      ? workspaceRootCandidate
      : workingDirectory;

  loadEnvironment({
    path: [resolve(workspaceRoot, '.env.local'), resolve(workspaceRoot, '.env')],
    quiet: true,
  });
}

function requiredSeedValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new SeedConfigurationError(`Defina ${name} antes de executar o seed administrativo.`);
  }

  return value;
}

loadWorkspaceEnvironment();

async function seedAdmin(): Promise<void> {
  const directUrl = requiredSeedValue('DIRECT_URL');
  const adminUserId = requiredSeedValue('ADMIN_USER_ID');
  const adminDisplayName = requiredSeedValue('ADMIN_DISPLAY_NAME');

  if (!uuidPattern.test(adminUserId)) {
    throw new SeedConfigurationError(
      'ADMIN_USER_ID deve ser o UUID de um usuário existente no Supabase Auth.',
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: directUrl }),
  });

  try {
    const authenticatedUsers = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id
      FROM auth.users
      WHERE id = ${adminUserId}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (authenticatedUsers.length === 0) {
      throw new SeedConfigurationError(
        'ADMIN_USER_ID não corresponde a um usuário ativo do Supabase Auth.',
      );
    }

    const existingProfile = await prisma.profile.findUnique({
      select: { role: true },
      where: { id: adminUserId },
    });

    await prisma.profile.upsert({
      create: {
        displayName: adminDisplayName,
        id: adminUserId,
        role: UserRole.ADMIN,
      },
      update: {
        role: UserRole.ADMIN,
      },
      where: { id: adminUserId },
    });

    console.log(
      existingProfile?.role === UserRole.ADMIN
        ? 'Seed administrativo: perfil já estava configurado como ADMIN.'
        : 'Seed administrativo: perfil configurado como ADMIN com sucesso.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error(
    error instanceof SeedConfigurationError
      ? error.message
      : 'Seed administrativo falhou sem expor dados de conexão.',
  );
  process.exitCode = 1;
});
