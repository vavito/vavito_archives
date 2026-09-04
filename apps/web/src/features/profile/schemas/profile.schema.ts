export const PROFILE_LIMITS = {
  avatarBytes: 2 * 1024 * 1024,
  displayName: { max: 120, min: 2 },
} as const;

const ACCEPTED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export function normalizeDisplayName(value: string): string {
  return value.trim().replaceAll(/\s+/gu, ' ');
}

export function validateDisplayName(value: string): string | null {
  const normalized = normalizeDisplayName(value);

  if (normalized.length < PROFILE_LIMITS.displayName.min) {
    return 'Informe seu nome com pelo menos 2 caracteres.';
  }

  if (normalized.length > PROFILE_LIMITS.displayName.max) {
    return 'O nome deve ter no máximo 120 caracteres.';
  }

  return null;
}

export function validateAvatar(file: File): string | null {
  if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
    return 'Escolha uma imagem JPG, PNG ou WebP.';
  }

  if (file.size > PROFILE_LIMITS.avatarBytes) {
    return 'A imagem deve ter no máximo 2 MB.';
  }

  return null;
}
