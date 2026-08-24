import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
import { ListAdminCommentsQueryDto } from '@api/modules/comments/dto/query/list-comments-query.dto';
import { ModerateCommentDto } from '@api/modules/comments/dto/request/moderate-comment.dto';
import {
  CommentAdminResponseDto,
  PaginatedAdminCommentsResponseDto,
} from '@api/modules/comments/dto/response/comment-response.dto';
import { CommentsService } from '@api/modules/comments/services/comments.service';

@Roles(UserRole.ADMIN)
@ApiBearerAuth('supabase-jwt')
@ApiTags('Admin Comments')
@ApiBadRequestResponse({ description: 'Dados ou parâmetros inválidos.', type: ErrorResponseDto })
@ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: 'Acesso exclusivo de administrador.', type: ErrorResponseDto })
@Controller('admin/comments')
export class AdminCommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista comentários para moderação' })
  @ApiOkResponse({ type: PaginatedAdminCommentsResponseDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAdminCommentsQueryDto,
  ): Promise<PaginatedAdminCommentsResponseDto> {
    return this.commentsService.listAdmin(user.id, query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Modera um comentário' })
  @ApiOkResponse({ type: CommentAdminResponseDto })
  @ApiNotFoundResponse({ description: 'Comentário não encontrado.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Transição de estado inválida.', type: ErrorResponseDto })
  moderate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ModerateCommentDto,
  ): Promise<CommentAdminResponseDto> {
    return this.commentsService.moderate(user.id, id, dto);
  }
}
