import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import { Roles } from '@api/core/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { UserRole } from '@api/generated/prisma/client';
import { MAX_MEDIA_SIZE_BYTES } from '@api/modules/media/domain/value-objects/media-metadata.value-object';
import { UploadMediaDto } from '@api/modules/media/dto/request/upload-media.dto';
import { MediaResponseDto } from '@api/modules/media/dto/response/media-response.dto';
import { MediaResponseMapper } from '@api/modules/media/mappers/media-response.mapper';
import { MediaFilePipe, type ValidatedMediaUpload } from '@api/modules/media/pipes/media-file.pipe';
import { MediaService } from '@api/modules/media/services/media.service';

@Roles(UserRole.ADMIN)
@ApiBearerAuth('supabase-jwt')
@ApiTags('Admin Media')
@ApiBadRequestResponse({
  description: 'Arquivo ou texto alternativo inválido.',
  type: ErrorResponseDto,
})
@ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: 'Acesso exclusivo de administrador.', type: ErrorResponseDto })
@ApiPayloadTooLargeResponse({ description: 'Arquivo maior que 10 MB.', type: ErrorResponseDto })
@ApiUnsupportedMediaTypeResponse({
  description: 'Conteúdo, MIME ou extensão não suportado.',
  type: ErrorResponseDto,
})
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_MEDIA_SIZE_BYTES } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: {
        altText: { example: 'Diagrama da arquitetura da aplicação', type: 'string' },
        file: { format: 'binary', type: 'string' },
      },
      required: ['file', 'altText'],
      type: 'object',
    },
  })
  @ApiOperation({ summary: 'Envia uma mídia para uso editorial' })
  @ApiCreatedResponse({ type: MediaResponseDto })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadMediaDto,
    @UploadedFile(MediaFilePipe) file: ValidatedMediaUpload,
  ): Promise<MediaResponseDto> {
    const result = await this.mediaService.upload({
      ...file,
      altText: dto.altText,
      createdById: user.id,
    });

    return MediaResponseMapper.toResponse(result.mediaAsset, result.publicUrl);
  }
}
