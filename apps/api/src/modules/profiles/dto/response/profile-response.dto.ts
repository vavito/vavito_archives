import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserRole } from '@api/generated/prisma/client';

export class ProfileResponseDto {
  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000001', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'João Victor' })
  displayName!: string;

  @ApiPropertyOptional({
    example: 'https://project.supabase.co/storage/v1/object/public/avatars/id/avatar.webp',
    nullable: true,
    type: String,
  })
  avatarUrl!: string | null;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', example: UserRole.USER })
  role!: UserRole;

  @ApiProperty({ example: '2026-08-12T20:15:00.000Z', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ example: '2026-08-27T20:15:00.000Z', format: 'date-time' })
  updatedAt!: string;
}
