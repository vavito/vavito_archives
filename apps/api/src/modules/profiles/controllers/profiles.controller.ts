import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import type { AvatarUpload } from '@api/core/storage/avatar-storage.service';
import { DeleteAccountDto } from '@api/modules/profiles/dto/request/delete-account.dto';
import { UpdateProfileDto } from '@api/modules/profiles/dto/request/update-profile.dto';
import { ProfileResponseDto } from '@api/modules/profiles/dto/response/profile-response.dto';
import {
  AvatarFilePipe,
  MAX_AVATAR_SIZE_BYTES,
} from '@api/modules/profiles/pipes/avatar-file.pipe';
import { ProfilesService } from '@api/modules/profiles/services/profiles.service';

@ApiBearerAuth('supabase-jwt')
@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Consulta o perfil do usuário autenticado' })
  @ApiOkResponse({ type: ProfileResponseDto })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<ProfileResponseDto> {
    return this.profilesService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualiza o perfil do usuário autenticado' })
  @ApiOkResponse({ type: ProfileResponseDto })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.updateMe(user.id, dto);
  }

  @Put('me/avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_SIZE_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: { file: { format: 'binary', type: 'string' } },
      required: ['file'],
      type: 'object',
    },
  })
  @ApiOperation({ summary: 'Envia ou substitui o avatar do usuário autenticado' })
  @ApiOkResponse({ type: ProfileResponseDto })
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(AvatarFilePipe) file: AvatarUpload,
  ): Promise<ProfileResponseDto> {
    return this.profilesService.uploadAvatar(user.id, file);
  }

  @Delete('me/avatar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove o avatar do usuário autenticado' })
  @ApiNoContentResponse()
  removeAvatar(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.profilesService.removeAvatar(user.id);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui e anonimiza a conta do usuário autenticado' })
  @ApiNoContentResponse()
  deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteAccountDto,
  ): Promise<void> {
    void dto;
    return this.profilesService.deleteAccount(user.id);
  }
}
