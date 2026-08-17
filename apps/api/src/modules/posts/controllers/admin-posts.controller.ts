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
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import { Roles } from '@api/core/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { UserRole } from '@api/generated/prisma/client';
import { ListAdminPostsQueryDto } from '@api/modules/posts/dto/query/list-admin-posts-query.dto';
import { CreatePostDto } from '@api/modules/posts/dto/request/create-post.dto';
import { DeletePostDto } from '@api/modules/posts/dto/request/delete-post.dto';
import { UpdatePostDto } from '@api/modules/posts/dto/request/update-post.dto';
import {
  PaginatedPostAdminSummaryDto,
  PaginatedPostRevisionAdminDto,
} from '@api/modules/posts/dto/response/paginated-posts-response.dto';
import { PostAdminDetailDto } from '@api/modules/posts/dto/response/post-admin-response.dto';
import { PostsService } from '@api/modules/posts/services/posts.service';
import { AdminPaginationQueryDto } from '@api/shared/pagination/dto/pagination-query.dto';

@Roles(UserRole.ADMIN)
@ApiBearerAuth('supabase-jwt')
@ApiTags('Admin Posts')
@ApiBadRequestResponse({ description: 'Dados ou parâmetros inválidos.', type: ErrorResponseDto })
@ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: 'Acesso exclusivo de administrador.', type: ErrorResponseDto })
@ApiNotFoundResponse({ description: 'Post não encontrado.', type: ErrorResponseDto })
@ApiConflictResponse({ description: 'Estado ou slug incompatível.', type: ErrorResponseDto })
@ApiUnprocessableEntityResponse({
  description: 'Conteúdo ou slug semanticamente inválido.',
  type: ErrorResponseDto,
})
@Controller('admin/posts')
export class AdminPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista posts para administração' })
  @ApiOkResponse({ type: PaginatedPostAdminSummaryDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAdminPostsQueryDto,
  ): Promise<PaginatedPostAdminSummaryDto> {
    return this.postsService.listAdmin(user.id, query);
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Lista o histórico de edições de um post publicado' })
  @ApiOkResponse({ type: PaginatedPostRevisionAdminDto })
  listRevisions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: AdminPaginationQueryDto,
  ): Promise<PaginatedPostRevisionAdminDto> {
    return this.postsService.listRevisions(user.id, id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta um post para administração e preview' })
  @ApiOkResponse({ type: PostAdminDetailDto })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PostAdminDetailDto> {
    return this.postsService.getAdminDetail(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria um rascunho' })
  @ApiCreatedResponse({ type: PostAdminDetailDto })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePostDto,
  ): Promise<PostAdminDetailDto> {
    const post = await this.postsService.create(user.id, dto);
    return this.postsService.getAdminDetail(user.id, post.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita um post e registra revisão quando já publicado' })
  @ApiOkResponse({ type: PostAdminDetailDto })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostAdminDetailDto> {
    await this.postsService.update(user.id, id, dto);
    return this.postsService.getAdminDetail(user.id, id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publica um rascunho' })
  @ApiOkResponse({ type: PostAdminDetailDto })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PostAdminDetailDto> {
    return this.transition(user.id, id, 'publish');
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retorna um post publicado para rascunho' })
  @ApiOkResponse({ type: PostAdminDetailDto })
  unpublish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PostAdminDetailDto> {
    return this.transition(user.id, id, 'unpublish');
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arquiva um post' })
  @ApiOkResponse({ type: PostAdminDetailDto })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PostAdminDetailDto> {
    return this.transition(user.id, id, 'archive');
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restaura um post arquivado como rascunho' })
  @ApiOkResponse({ type: PostAdminDetailDto })
  restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PostAdminDetailDto> {
    return this.transition(user.id, id, 'restore');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui permanentemente um post elegível' })
  @ApiNoContentResponse()
  delete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DeletePostDto,
  ): Promise<void> {
    void dto;
    return this.postsService.delete(user.id, id);
  }

  private async transition(
    actorId: string,
    postId: string,
    action: 'archive' | 'publish' | 'restore' | 'unpublish',
  ): Promise<PostAdminDetailDto> {
    await this.postsService[action](actorId, postId);
    return this.postsService.getAdminDetail(actorId, postId);
  }
}
