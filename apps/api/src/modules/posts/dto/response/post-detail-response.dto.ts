import { ApiProperty } from '@nestjs/swagger';

import { ReactionType } from '@api/generated/prisma/client';
import { PostSummaryDto } from '@api/modules/posts/dto/response/post-summary.dto';
import { PostPublicAuthorDto } from './post-public-author.dto';

export class PostReactionCountsDto {
  @ApiProperty({ example: 12, minimum: 0 })
  like!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  dislike!: number;
}

export class PostViewerStateDto {
  @ApiProperty({
    enum: ReactionType,
    enumName: 'ReactionType',
    example: ReactionType.LIKE,
    nullable: true,
  })
  reaction!: ReactionType | null;

  @ApiProperty({ example: true })
  bookmarked!: boolean;
}

export class PostDetailResponseDto extends PostSummaryDto {
  @ApiProperty({ type: () => PostPublicAuthorDto })
  author!: PostPublicAuthorDto;

  @ApiProperty({
    additionalProperties: true,
    example: { content: [{ type: 'paragraph' }], type: 'doc' },
    type: 'object',
  })
  content!: Record<string, unknown>;

  @ApiProperty({ example: 1, minimum: 1 })
  contentSchemaVersion!: number;

  @ApiProperty({ example: 'Arquitetura NestJS', nullable: true, type: String })
  seoTitle!: string | null;

  @ApiProperty({
    example: 'Aprenda a organizar uma aplicação NestJS.',
    nullable: true,
    type: String,
  })
  seoDescription!: string | null;

  @ApiProperty({ type: () => PostReactionCountsDto })
  reactionCounts!: PostReactionCountsDto;

  @ApiProperty({ nullable: true, type: () => PostViewerStateDto })
  viewer!: PostViewerStateDto | null;
}
