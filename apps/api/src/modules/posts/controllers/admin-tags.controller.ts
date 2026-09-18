import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import { Roles } from '@api/core/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { UserRole } from '@api/generated/prisma/client';
import { UpdateTagVisibilityDto } from '@api/modules/posts/dto/request/update-tag-visibility.dto';
import { AdminTagResponseDto } from '@api/modules/posts/dto/response/admin-tag-response.dto';
import { PostsService } from '@api/modules/posts/services/posts.service';

@Roles(UserRole.ADMIN)
@ApiBearerAuth('supabase-jwt')
@ApiTags('Admin Tags')
@ApiBadRequestResponse({ description: 'Dados inválidos.', type: ErrorResponseDto })
@ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: 'Acesso exclusivo de administrador.', type: ErrorResponseDto })
@ApiNotFoundResponse({ description: 'Tópico não encontrado.', type: ErrorResponseDto })
@Controller('admin/tags')
export class AdminTagsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista tópicos e sua visibilidade pública' })
  @ApiOkResponse({ type: [AdminTagResponseDto] })
  list(@CurrentUser() user: AuthenticatedUser): Promise<AdminTagResponseDto[]> {
    return this.postsService.listAdminTags(user.id);
  }

  @Patch(':id/visibility')
  @ApiOperation({ summary: 'Atualiza a visibilidade pública de um tópico' })
  @ApiOkResponse({ type: AdminTagResponseDto })
  updateVisibility(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTagVisibilityDto,
  ): Promise<AdminTagResponseDto> {
    return this.postsService.updateTagVisibility(user.id, id, dto.isPublic);
  }
}
