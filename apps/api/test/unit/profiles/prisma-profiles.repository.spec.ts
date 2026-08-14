import type { PrismaService } from '@api/core/database/prisma.service';
import { UserRole } from '@api/generated/prisma/client';
import { Profile } from '@api/modules/profiles/domain/entities/profile.entity';
import { PrismaProfilesRepository } from '@api/modules/profiles/repositories/prisma-profiles.repository';

const PROFILE_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';
const CREATED_AT = new Date('2026-08-01T10:00:00.000Z');

describe('PrismaProfilesRepository', () => {
  const findFirst = jest.fn();
  const findUnique = jest.fn();
  const update = jest.fn();
  const deleteReactions = jest.fn();
  const deleteBookmarks = jest.fn();
  const transaction = jest.fn();
  const prisma = {
    $transaction: transaction,
    bookmark: { deleteMany: deleteBookmarks },
    profile: { findFirst, findUnique, update },
    reaction: { deleteMany: deleteReactions },
  } as unknown as PrismaService;
  const repository = new PrismaProfilesRepository(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consulta somente Profile ativo', async () => {
    findFirst.mockResolvedValueOnce({
      avatarPath: null,
      createdAt: CREATED_AT,
      deletedAt: null,
      displayName: 'João Victor',
      id: PROFILE_ID,
      role: UserRole.USER,
      updatedAt: CREATED_AT,
    });

    await expect(repository.findActiveById(PROFILE_ID)).resolves.toMatchObject({ id: PROFILE_ID });
    expect(findFirst).toHaveBeenCalledWith({ where: { deletedAt: null, id: PROFILE_ID } });
  });

  it('apaga engajamentos e anonimiza o Profile na mesma transação', async () => {
    const profile = Profile.restore({
      avatarPath: null,
      createdAt: CREATED_AT,
      deletedAt: null,
      displayName: 'João Victor',
      id: PROFILE_ID,
      role: UserRole.USER,
      updatedAt: CREATED_AT,
    });
    const deletedAt = new Date('2026-08-02T10:00:00.000Z');
    profile.anonymize(deletedAt);
    deleteReactions.mockReturnValueOnce('delete-reactions');
    deleteBookmarks.mockReturnValueOnce('delete-bookmarks');
    update.mockReturnValueOnce('update-profile');

    await repository.anonymizeAccount(profile);

    expect(deleteReactions).toHaveBeenCalledWith({ where: { profileId: PROFILE_ID } });
    expect(deleteBookmarks).toHaveBeenCalledWith({ where: { profileId: PROFILE_ID } });
    expect(update).toHaveBeenCalledWith({
      data: {
        avatarPath: null,
        deletedAt,
        displayName: 'Usuário excluído',
        updatedAt: deletedAt,
      },
      where: { id: PROFILE_ID },
    });
    expect(transaction).toHaveBeenCalledWith([
      'delete-reactions',
      'delete-bookmarks',
      'update-profile',
    ]);
  });
});
