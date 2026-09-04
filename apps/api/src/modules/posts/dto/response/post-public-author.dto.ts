import { ApiProperty } from '@nestjs/swagger';

export class PostPublicAuthorDto {
  @ApiProperty({ example: 'João Victor' })
  displayName!: string;

  @ApiProperty({ nullable: true, type: String })
  avatarUrl!: string | null;
}
