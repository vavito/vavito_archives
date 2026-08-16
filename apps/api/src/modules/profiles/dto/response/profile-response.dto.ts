import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserRole } from '@api/generated/prisma/client';

export class ProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'João Victor' })
  displayName!: string;

  @ApiPropertyOptional({
    example: 'https://project.supabase.co/storage/v1/object/public/avatars/id/avatar.webp',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  role!: UserRole;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
