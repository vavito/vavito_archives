import { ApiProperty } from '@nestjs/swagger';

import { PostAdminSummaryDto } from '@api/modules/posts/dto/response/post-admin-response.dto';
import { PostSummaryDto } from '@api/modules/posts/dto/response/post-summary.dto';
import { PaginationMetaDto } from '@api/shared/pagination/dto/pagination-meta.dto';

export class PaginatedPostSummaryDto {
  @ApiProperty({ type: () => [PostSummaryDto] })
  items!: PostSummaryDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class PaginatedPostAdminSummaryDto {
  @ApiProperty({ type: () => [PostAdminSummaryDto] })
  items!: PostAdminSummaryDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta!: PaginationMetaDto;
}
