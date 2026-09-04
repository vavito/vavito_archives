import { Injectable, Logger } from '@nestjs/common';

import { AuthAdminService } from '@api/core/auth/services/auth-admin.service';
import { MailService } from '@api/core/mail/services/mail.service';
import {
  AvatarStorageService,
  type AvatarUpload,
} from '@api/core/storage/services/avatar-storage.service';
import type { UpdateProfileDto } from '@api/modules/profiles/dto/request/update-profile.dto';
import type { ProfileResponseDto } from '@api/modules/profiles/dto/response/profile-response.dto';
import { AccountDeletionException } from '@api/modules/profiles/errors/account-deletion.exception';
import { ProfileIntegrationException } from '@api/modules/profiles/errors/profile-integration.exception';
import { ProfileNotFoundException } from '@api/modules/profiles/errors/profile-not-found.exception';
import { ProfileMapper } from '@api/modules/profiles/mappers/profile.mapper';
import { ProfilesRepository } from '@api/modules/profiles/repositories/profiles.repository';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly profilesRepository: ProfilesRepository,
    private readonly avatarStorage: AvatarStorageService,
    private readonly authAdmin: AuthAdminService,
    private readonly mailService: MailService,
  ) {}

  async deleteAccount(profileId: string, recipient: string): Promise<void> {
    const profile = await this.profilesRepository.findById(profileId);

    if (!profile) {
      throw new ProfileNotFoundException();
    }

    if (!profile.deletedAt) {
      if (profile.avatarPath) {
        try {
          await this.avatarStorage.remove(profile.avatarPath);
        } catch (error) {
          throw new ProfileIntegrationException(
            'Não foi possível remover o avatar da conta.',
            error,
          );
        }
      }

      profile.anonymize(new Date());
      await this.profilesRepository.anonymizeAccount(profile);
    }

    try {
      await this.authAdmin.deleteUser(profileId);
    } catch (error) {
      throw new AccountDeletionException(error);
    }

    await this.sendAccountDeletionNotificationBestEffort(profileId, recipient);
  }

  async getMe(profileId: string): Promise<ProfileResponseDto> {
    const profile = await this.findActiveProfile(profileId);

    return this.toResponse(profile);
  }

  async removeAvatar(profileId: string): Promise<void> {
    const profile = await this.findActiveProfile(profileId);
    const previousAvatarPath = profile.avatarPath;

    if (!previousAvatarPath) {
      return;
    }

    profile.removeAvatar(new Date());
    await this.profilesRepository.save(profile);
    await this.removeStoredAvatarBestEffort(previousAvatarPath);
  }

  async updateMe(profileId: string, dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const profile = await this.findActiveProfile(profileId);

    if (dto.displayName !== undefined) {
      profile.changeDisplayName(dto.displayName, new Date());
      await this.profilesRepository.save(profile);
    }

    return this.toResponse(profile);
  }

  async uploadAvatar(profileId: string, file: AvatarUpload): Promise<ProfileResponseDto> {
    const profile = await this.findActiveProfile(profileId);
    const previousAvatarPath = profile.avatarPath;
    let uploadedPath: string;

    try {
      uploadedPath = await this.avatarStorage.upload(profileId, file);
    } catch (error) {
      throw new ProfileIntegrationException('Não foi possível enviar o avatar.', error);
    }

    try {
      profile.changeAvatar(uploadedPath, new Date());
      await this.profilesRepository.save(profile);
    } catch (error) {
      await this.removeStoredAvatarBestEffort(uploadedPath);
      throw error;
    }

    if (previousAvatarPath) {
      await this.removeStoredAvatarBestEffort(previousAvatarPath);
    }

    return this.toResponse(profile);
  }

  private async findActiveProfile(profileId: string) {
    const profile = await this.profilesRepository.findActiveById(profileId);

    if (!profile) {
      throw new ProfileNotFoundException();
    }

    return profile;
  }

  private async removeStoredAvatarBestEffort(path: string): Promise<void> {
    try {
      await this.avatarStorage.remove(path);
    } catch (error) {
      this.logger.warn(`Falha ao remover o avatar ${path}.`, error);
    }
  }

  private async sendAccountDeletionNotificationBestEffort(
    profileId: string,
    recipient: string,
  ): Promise<void> {
    try {
      await this.mailService.sendAccountDeletionNotification({ profileId, recipient });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar a confirmação de exclusão da conta ${profileId}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private toResponse(profile: Awaited<ReturnType<ProfilesService['findActiveProfile']>>) {
    const avatarUrl = profile.avatarPath ? this.avatarStorage.publicUrl(profile.avatarPath) : null;

    return ProfileMapper.toResponse(profile, avatarUrl);
  }
}
