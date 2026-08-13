import { PrismaProfileAuthorizationRepository } from '@api/core/auth/repositories/prisma-profile-authorization.repository';
import type { PrismaService } from '@api/core/database/prisma.service';
import { UserRole } from '@api/generated/prisma/client';

describe('PrismaProfileAuthorizationRepository', () => {
  const findFirst = jest.fn();
  const prisma = { profile: { findFirst } } as unknown as PrismaService;
  const repository = new PrismaProfileAuthorizationRepository(prisma);

  beforeEach(() => {
    findFirst.mockReset();
  });

  it('consulta somente a role de um Profile ativo', async () => {
    findFirst.mockResolvedValueOnce({ role: UserRole.ADMIN });

    await expect(
      repository.findActiveRoleByProfileId('2cc721a8-2db5-4e7f-b68a-d807546b5206'),
    ).resolves.toBe(UserRole.ADMIN);
    expect(findFirst).toHaveBeenCalledWith({
      select: { role: true },
      where: {
        deletedAt: null,
        id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
      },
    });
  });

  it('retorna null quando não existe Profile ativo', async () => {
    findFirst.mockResolvedValueOnce(null);

    await expect(
      repository.findActiveRoleByProfileId('2cc721a8-2db5-4e7f-b68a-d807546b5206'),
    ).resolves.toBeNull();
  });
});
