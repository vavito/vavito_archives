import type { AuthAdminService } from '@api/core/auth/services/auth-admin.service';
import type { AvatarStorageService } from '@api/core/storage/avatar-storage.service';
import { UserRole } from '@api/generated/prisma/client';
import { Profile } from '@api/modules/profiles/domain/entities/profile.entity';
import { AccountDeletionException } from '@api/modules/profiles/errors/account-deletion.exception';
import { ProfileNotFoundException } from '@api/modules/profiles/errors/profile-not-found.exception';
import { ProfilesService } from '@api/modules/profiles/services/profiles.service';
import type { ProfilesRepository } from '@api/modules/profiles/repositories/profiles.repository';

const PROFILE_ID = '2cc721a8-2db5-4e7f-b68a-d807546b5206';

function profile(avatarPath: string | null = null): Profile {
  return Profile.restore({
    avatarPath,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    deletedAt: null,
    displayName: 'João Victor',
    id: PROFILE_ID,
    role: UserRole.USER,
    updatedAt: new Date('2026-08-01T10:00:00.000Z'),
  });
}

describe('ProfilesService', () => {
  const findActiveById = jest.fn();
  const findById = jest.fn();
  const save = jest.fn();
  const anonymizeAccount = jest.fn();
  const upload = jest.fn();
  const remove = jest.fn();
  const publicUrl = jest.fn();
  const deleteUser = jest.fn();
  const repository = {
    anonymizeAccount,
    findActiveById,
    findById,
    save,
  } as unknown as ProfilesRepository;
  const avatarStorage = { publicUrl, remove, upload } as unknown as AvatarStorageService;
  const authAdmin = { deleteUser } as unknown as AuthAdminService;
  const service = new ProfilesService(repository, avatarStorage, authAdmin);

  beforeEach(() => {
    jest.clearAllMocks();
    publicUrl.mockImplementation((path: string) => `https://cdn.example/${path}`);
  });

  it('retorna o perfil ativo com a URL pública derivada do avatarPath', async () => {
    findActiveById.mockResolvedValueOnce(profile('profile/avatar.webp'));

    await expect(service.getMe(PROFILE_ID)).resolves.toMatchObject({
      avatarUrl: 'https://cdn.example/profile/avatar.webp',
      displayName: 'João Victor',
      id: PROFILE_ID,
    });
  });

  it('responde como não encontrado quando o perfil não está ativo', async () => {
    findActiveById.mockResolvedValueOnce(null);

    await expect(service.getMe(PROFILE_ID)).rejects.toBeInstanceOf(ProfileNotFoundException);
  });

  it('atualiza o nome pelo agregado Profile', async () => {
    const restoredProfile = profile();
    findActiveById.mockResolvedValueOnce(restoredProfile);

    const response = await service.updateMe(PROFILE_ID, { displayName: '  Novo   Nome ' });

    expect(save).toHaveBeenCalledWith(restoredProfile);
    expect(response.displayName).toBe('Novo Nome');
  });

  it('substitui o avatar e remove o arquivo anterior', async () => {
    const restoredProfile = profile('old.webp');
    findActiveById.mockResolvedValueOnce(restoredProfile);
    upload.mockResolvedValueOnce('new.webp');

    const response = await service.uploadAvatar(PROFILE_ID, {
      buffer: Buffer.from('avatar'),
      contentType: 'image/webp',
      extension: 'webp',
    });

    expect(save).toHaveBeenCalledWith(restoredProfile);
    expect(remove).toHaveBeenCalledWith('old.webp');
    expect(response.avatarUrl).toBe('https://cdn.example/new.webp');
  });

  it('remove o novo arquivo quando a persistência do avatar falha', async () => {
    findActiveById.mockResolvedValueOnce(profile());
    upload.mockResolvedValueOnce('new.webp');
    save.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(
      service.uploadAvatar(PROFILE_ID, {
        buffer: Buffer.from('avatar'),
        contentType: 'image/webp',
        extension: 'webp',
      }),
    ).rejects.toThrow('database unavailable');
    expect(remove).toHaveBeenCalledWith('new.webp');
  });

  it('anonimiza o perfil antes de excluir a identidade no Supabase Auth', async () => {
    const restoredProfile = profile('avatar.webp');
    findById.mockResolvedValueOnce(restoredProfile);

    await service.deleteAccount(PROFILE_ID);

    expect(remove).toHaveBeenCalledWith('avatar.webp');
    expect(anonymizeAccount).toHaveBeenCalledWith(restoredProfile);
    expect(deleteUser).toHaveBeenCalledWith(PROFILE_ID);
    expect(restoredProfile.deletedAt).not.toBeNull();
  });

  it('permite repetir a exclusão da identidade após falha no Supabase Auth', async () => {
    const restoredProfile = profile();
    restoredProfile.anonymize(new Date());
    findById.mockResolvedValueOnce(restoredProfile);
    deleteUser.mockRejectedValueOnce(new Error('auth unavailable'));

    await expect(service.deleteAccount(PROFILE_ID)).rejects.toBeInstanceOf(
      AccountDeletionException,
    );
    expect(anonymizeAccount).not.toHaveBeenCalled();
    expect(deleteUser).toHaveBeenCalledWith(PROFILE_ID);
  });
});
