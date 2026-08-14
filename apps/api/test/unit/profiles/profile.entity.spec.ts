import { UserRole } from '@api/generated/prisma/client';
import { InvalidProfileDisplayNameError } from '@api/modules/profiles/domain/errors/invalid-profile-display-name.error';
import { Profile } from '@api/modules/profiles/domain/entities/profile.entity';

const CREATED_AT = new Date('2026-08-01T10:00:00.000Z');

function restoreProfile(): Profile {
  return Profile.restore({
    avatarPath: null,
    createdAt: CREATED_AT,
    deletedAt: null,
    displayName: 'João Victor',
    id: '2cc721a8-2db5-4e7f-b68a-d807546b5206',
    role: UserRole.USER,
    updatedAt: CREATED_AT,
  });
}

describe('Profile', () => {
  it('normaliza o nome ao alterá-lo', () => {
    const profile = restoreProfile();
    const now = new Date('2026-08-02T10:00:00.000Z');

    profile.changeDisplayName('  João   da Silva  ', now);

    expect(profile.displayName).toBe('João da Silva');
    expect(profile.updatedAt).toBe(now);
  });

  it('rejeita um nome vazio', () => {
    const profile = restoreProfile();

    expect(() => profile.changeDisplayName('   ', new Date())).toThrow(
      InvalidProfileDisplayNameError,
    );
  });

  it('anonimiza o perfil sem alterar sua role e datas históricas', () => {
    const profile = restoreProfile();
    const now = new Date('2026-08-03T10:00:00.000Z');
    profile.changeAvatar('profile/avatar.webp', new Date('2026-08-02T10:00:00.000Z'));

    profile.anonymize(now);

    expect(profile.avatarPath).toBeNull();
    expect(profile.deletedAt).toBe(now);
    expect(profile.displayName).toBe('Usuário excluído');
    expect(profile.role).toBe(UserRole.USER);
    expect(profile.createdAt).toBe(CREATED_AT);
  });
});
