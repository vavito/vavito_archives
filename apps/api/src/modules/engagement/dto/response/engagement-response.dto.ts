import { ApiProperty } from '@nestjs/swagger';

import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';

export class ReactionCountsDto {
  @ApiProperty({ example: 12, minimum: 0 })
  like!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  dislike!: number;
}

export class ReactionResponseDto {
  @ApiProperty({ enum: ReactionType, enumName: 'ReactionType', nullable: true })
  reaction!: ReactionType | null;

  @ApiProperty({ type: () => ReactionCountsDto })
  counts!: ReactionCountsDto;
}

export class BookmarkResponseDto {
  @ApiProperty({ example: true })
  bookmarked!: boolean;
}
