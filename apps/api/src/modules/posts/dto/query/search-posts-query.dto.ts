import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const POST_SEARCH_MAX_RESULTS = 8;
export const POST_SEARCH_QUERY_MAX_LENGTH = 200;

export class SearchPostsQueryDto {
  @ApiProperty({ example: 'nestjs', maxLength: POST_SEARCH_QUERY_MAX_LENGTH })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replaceAll(/\s+/g, ' ') : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(POST_SEARCH_QUERY_MAX_LENGTH)
  q!: string;
}
