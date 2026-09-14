'use client';

import { cn } from '@vavito/ui';
import { UserRound } from 'lucide-react';
import { useState } from 'react';

import { ProgressiveImage } from '@web/components/feedback/progressive-image';

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
  const pixels = size === 'large' ? 96 : 32;
  const shouldRenderImage = Boolean(avatarUrl) && failedAvatarUrl !== avatarUrl;

  return (
    <span
      className={cn(
        'bg-surface-raised relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-border font-semibold text-accent',
        size === 'large' ? 'size-24 text-2xl' : 'size-8 text-[11px]',
        className,
      )}
    >
      {shouldRenderImage ? (
        <ProgressiveImage
          alt={`Foto de ${displayName}`}
          className="object-cover"
          containerClassName="absolute inset-0 rounded-full"
          fill
          loadingLabel="Carregando foto do perfil"
          onError={() => setFailedAvatarUrl(avatarUrl)}
          sizes={`${pixels}px`}
          src={avatarUrl as string}
        />
      ) : (
        <span aria-label={`Iniciais de ${displayName}`}>
          {initials(displayName) || <UserRound aria-hidden="true" />}
        </span>
      )}
    </span>
  );
}
