import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '@api/core/auth/decorators/public.decorator';
import { TagResponseDto } from '@api/modules/posts/dto/response/tag-response.dto';
import { PostsService } from '@api/modules/posts/services/posts.service';

@Public()
@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista tags e a quantidade de posts publicados' })
  @ApiOkResponse({ type: [TagResponseDto] })
  list(): Promise<TagResponseDto[]> {
    return this.postsService.listTags();
  }
}
