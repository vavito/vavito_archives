'use client';

import { cn } from '@vavito/ui';
import { UserRound } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface ProfileAvatarProps {
  avatarUrl: string | null;
  className?: string;
  displayName: string;
  size?: 'large' | 'small';
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function ProfileAvatar({
  avatarUrl,
  className,
  displayName,
  size = 'large',
}: Readonly<ProfileAvatarProps>) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [loadedAvatarUrl, setLoadedAvatarUrl] = useState<string | null>(null);
  const pixels = size === 'large' ? 96 : 32;
  const shouldRenderImage = Boolean(avatarUrl) && failedAvatarUrl !== avatarUrl;
  const isLoading = shouldRenderImage && loadedAvatarUrl !== avatarUrl;

  return (
    <span
      aria-busy={shouldRenderImage && isLoading ? true : undefined}
      className={cn(
        'bg-surface-raised relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-border font-semibold text-accent',
        size === 'large' ? 'size-24 text-2xl' : 'size-8 text-[11px]',
        className,
      )}
    >
      {shouldRenderImage ? (
        <>
          {isLoading ? (
            <span
              aria-label="Carregando foto do perfil"
              className="profile-avatar-loading absolute inset-0"
              role="status"
            />
          ) : null}
          <Image
            unoptimized
            alt={`Foto de ${displayName}`}
            className={cn(
              'size-full object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
            )}
            height={pixels}
            onError={() => {
              setFailedAvatarUrl(avatarUrl);
            }}
            onLoad={() => setLoadedAvatarUrl(avatarUrl)}
            src={avatarUrl as string}
            width={pixels}
          />
        </>
      ) : (
        <span aria-label={`Iniciais de ${displayName}`}>
          {initials(displayName) || <UserRound aria-hidden="true" />}
        </span>
      )}
    </span>
  );
}
