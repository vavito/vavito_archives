import { ApiProperty } from '@nestjs/swagger';

export class PostPublicAuthorDto {
  @ApiProperty({ example: 'João Victor' })
  displayName!: string;

  @ApiProperty({ example: 'https://example.com/avatars/author.webp', nullable: true, type: String })
  avatarUrl!: string | null;
}
