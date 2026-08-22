import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import { Public } from '@api/core/auth/decorators/public.decorator';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { ListCommentsQueryDto } from '@api/modules/comments/dto/query/list-comments-query.dto';
import { CreateCommentDto } from '@api/modules/comments/dto/request/create-comment.dto';
import { UpdateCommentDto } from '@api/modules/comments/dto/request/update-comment.dto';
import {
  CommentResponseDto,
  PaginatedCommentsResponseDto,
} from '@api/modules/comments/dto/response/comment-response.dto';
import { CommentsRateLimitGuard } from '@api/modules/comments/guards/comments-rate-limit.guard';
import { CommentsService } from '@api/modules/comments/services/comments.service';

@ApiTags('Comments')
@ApiBadRequestResponse({ description: 'Dados ou parâmetros inválidos.', type: ErrorResponseDto })
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get('posts/:slug/comments')
  @ApiOperation({ summary: 'Lista comentários visíveis e respostas diretas' })
  @ApiOkResponse({ type: PaginatedCommentsResponseDto })
  @ApiNotFoundResponse({
    description: 'Post não encontrado ou não publicado.',
    type: ErrorResponseDto,
  })
  list(
    @Param('slug') slug: string,
    @Query() query: ListCommentsQueryDto,
  ): Promise<PaginatedCommentsResponseDto> {
    return this.commentsService.listPublic(slug, query);
  }

  @Post('posts/:slug/comments')
  @UseGuards(CommentsRateLimitGuard)
  @ApiBearerAuth('supabase-jwt')
  @ApiOperation({ summary: 'Publica um comentário ou resposta' })
  @ApiCreatedResponse({ type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'Comentário pai ou profundidade inválida.',
    type: ErrorResponseDto,
  })
  @ApiUnprocessableEntityResponse({ description: 'Conteúdo inválido.', type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({
    description: 'Limite de comentários excedido.',
    type: ErrorResponseDto,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(user.id, slug, dto);
  }

  @Patch('comments/:id')
  @ApiBearerAuth('supabase-jwt')
  @ApiOperation({ summary: 'Edita um comentário próprio' })
  @ApiOkResponse({ type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Somente o autor pode editar.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'Comentário não encontrado.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Estado não editável.', type: ErrorResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(user.id, id, dto);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('supabase-jwt')
  @ApiOperation({ summary: 'Aplica soft delete a um comentário' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
  @ApiForbiddenResponse({
    description: 'Acesso restrito ao autor ou administrador.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Comentário não encontrado.', type: ErrorResponseDto })
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.commentsService.delete(user.id, id);
  }
}
