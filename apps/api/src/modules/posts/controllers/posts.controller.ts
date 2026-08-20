import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

import { Public } from '@api/core/auth/decorators/public.decorator';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { ListPublicPostsQueryDto } from '@api/modules/posts/dto/query/list-public-posts-query.dto';
import { SearchPostsQueryDto } from '@api/modules/posts/dto/query/search-posts-query.dto';
import { PaginatedPostSummaryDto } from '@api/modules/posts/dto/response/paginated-posts-response.dto';
import { PostDetailResponseDto } from '@api/modules/posts/dto/response/post-detail-response.dto';
import { PostSummaryDto } from '@api/modules/posts/dto/response/post-summary.dto';
import { PostViewsRateLimitGuard } from '@api/modules/posts/guards/post-views-rate-limit.guard';
import { PostsService } from '@api/modules/posts/services/posts.service';

interface RedirectResponse {
  location(path: string): RedirectResponse;
  status(statusCode: number): RedirectResponse;
}

interface PostViewRequest {
  headers: { 'user-agent'?: string };
  ip: string;
}

@Public()
@ApiTags('Posts')
@ApiBadRequestResponse({ description: 'Parâmetros inválidos.', type: ErrorResponseDto })
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista posts publicados' })
  @ApiOkResponse({ type: PaginatedPostSummaryDto })
  list(@Query() query: ListPublicPostsQueryDto): Promise<PaginatedPostSummaryDto> {
    return this.postsService.listPublic(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Busca posts publicados por título, resumo ou tag' })
  @ApiOkResponse({ type: [PostSummaryDto] })
  search(@Query() query: SearchPostsQueryDto): Promise<PostSummaryDto[]> {
    return this.postsService.searchPublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Consulta um post publicado pelo slug' })
  @ApiOkResponse({ type: PostDetailResponseDto })
  @ApiNotFoundResponse({
    description: 'Post inexistente ou não publicado.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    description: 'O slug informado é histórico; redireciona para o slug atual.',
    status: HttpStatus.PERMANENT_REDIRECT,
  })
  async getBySlug(
    @Param('slug') slug: string,
    @Res({ passthrough: true }) response: RedirectResponse,
  ): Promise<PostDetailResponseDto> {
    const result = await this.postsService.getPublicDetail(slug);

    if (result.shouldRedirect) {
      response
        .status(HttpStatus.PERMANENT_REDIRECT)
        .location(`/api/v1/posts/${encodeURIComponent(result.canonicalSlug)}`);
    }

    return result.data;
  }

  @Post(':slug/views')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(PostViewsRateLimitGuard)
  @ApiOperation({ summary: 'Registra uma visualização do post publicado' })
  @ApiAcceptedResponse({ description: 'Visualização aceita para processamento.' })
  @ApiNotFoundResponse({
    description: 'Post inexistente ou não publicado.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Limite de registros de visualização excedido.',
    type: ErrorResponseDto,
  })
  async registerView(@Param('slug') slug: string, @Req() request: PostViewRequest): Promise<void> {
    await this.postsService.registerView(slug, {
      ip: request.ip,
      userAgent: request.headers['user-agent'] ?? '',
    });
  }
}
