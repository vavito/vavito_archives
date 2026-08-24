import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { ListBookmarksQueryDto } from '@api/modules/engagement/dto/query/list-bookmarks-query.dto';
import { SetReactionDto } from '@api/modules/engagement/dto/request/set-reaction.dto';
import {
  BookmarkResponseDto,
  ReactionResponseDto,
} from '@api/modules/engagement/dto/response/engagement-response.dto';
import { EngagementResponseMapper } from '@api/modules/engagement/mappers/engagement-response.mapper';
import { BookmarksService } from '@api/modules/engagement/services/bookmarks.service';
import { ReactionsService } from '@api/modules/engagement/services/reactions.service';
import { PaginatedPostSummaryDto } from '@api/modules/posts/dto/response/paginated-posts-response.dto';

@ApiBearerAuth('supabase-jwt')
@ApiTags('Engagement')
@ApiBadRequestResponse({ description: 'Dados ou parâmetros inválidos.', type: ErrorResponseDto })
@ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: 'Perfil inativo ou sem acesso.', type: ErrorResponseDto })
@Controller()
export class EngagementController {
  constructor(
    private readonly reactionsService: ReactionsService,
    private readonly bookmarksService: BookmarksService,
  ) {}

  @Put('posts/:id/reaction')
  @ApiOperation({ summary: 'Cria ou troca a reação do usuário no post' })
  @ApiOkResponse({ type: ReactionResponseDto })
  @ApiNotFoundResponse({
    description: 'Post não encontrado ou não publicado.',
    type: ErrorResponseDto,
  })
  async setReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) postId: string,
    @Body() dto: SetReactionDto,
  ): Promise<ReactionResponseDto> {
    return EngagementResponseMapper.toReaction(
      await this.reactionsService.set(user.id, postId, dto.type),
    );
  }

  @Delete('posts/:id/reaction')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a reação atual do usuário no post' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({
    description: 'Post não encontrado ou não publicado.',
    type: ErrorResponseDto,
  })
  async removeReaction(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) postId: string,
  ): Promise<void> {
    await this.reactionsService.remove(user.id, postId);
  }

  @Get('bookmarks')
  @ApiOperation({ summary: 'Lista a biblioteca privada de posts salvos' })
  @ApiOkResponse({ type: PaginatedPostSummaryDto })
  listBookmarks(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListBookmarksQueryDto,
  ): Promise<PaginatedPostSummaryDto> {
    return this.bookmarksService.list(user.id, query);
  }

  @Put('posts/:id/bookmark')
  @ApiOperation({ summary: 'Salva um post na biblioteca do usuário' })
  @ApiOkResponse({ type: BookmarkResponseDto })
  @ApiNotFoundResponse({
    description: 'Post não encontrado ou não publicado.',
    type: ErrorResponseDto,
  })
  async saveBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) postId: string,
  ): Promise<BookmarkResponseDto> {
    await this.bookmarksService.save(user.id, postId);
    return EngagementResponseMapper.toBookmark();
  }

  @Delete('posts/:id/bookmark')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um post da biblioteca do usuário' })
  @ApiNoContentResponse()
  async removeBookmark(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) postId: string,
  ): Promise<void> {
    await this.bookmarksService.remove(user.id, postId);
  }
}
