import type { UserRole } from '@api/generated/prisma/client';
import { InvalidProfileDisplayNameError } from '@api/modules/profiles/domain/errors/invalid-profile-display-name.error';
import { ProfileAlreadyDeletedError } from '@api/modules/profiles/domain/errors/profile-already-deleted.error';

export interface ProfileProps {
  avatarPath: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  displayName: string;
  id: string;
  role: UserRole;
  updatedAt: Date;
}

const DELETED_PROFILE_DISPLAY_NAME = 'Usuário excluído';

function normalizedDisplayName(displayName: string): string {
  const normalized = displayName.trim().replaceAll(/\s+/g, ' ');

  if (normalized.length < 1 || normalized.length > 120) {
    throw new InvalidProfileDisplayNameError();
  }

  return normalized;
}

export class Profile {
  private constructor(private readonly props: ProfileProps) {}

  static restore(props: ProfileProps): Profile {
    if (!props.deletedAt) {
      normalizedDisplayName(props.displayName);
    }

    return new Profile({ ...props });
  }

  get avatarPath(): string | null {
    return this.props.avatarPath;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get id(): string {
    return this.props.id;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  changeDisplayName(displayName: string, now: Date): void {
    this.ensureActive();
    this.props.displayName = normalizedDisplayName(displayName);
    this.props.updatedAt = now;
  }

  changeAvatar(avatarPath: string, now: Date): void {
    this.ensureActive();
    this.props.avatarPath = avatarPath;
    this.props.updatedAt = now;
  }

  removeAvatar(now: Date): void {
    this.ensureActive();
    this.props.avatarPath = null;
    this.props.updatedAt = now;
  }

  anonymize(now: Date): void {
    if (this.props.deletedAt) {
      return;
    }

    this.props.avatarPath = null;
    this.props.deletedAt = now;
    this.props.displayName = DELETED_PROFILE_DISPLAY_NAME;
    this.props.updatedAt = now;
  }

  private ensureActive(): void {
    if (this.props.deletedAt) {
      throw new ProfileAlreadyDeletedError();
    }
  }
}
