import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ReactionType } from '@api/modules/engagement/domain/enums/reaction-type.enum';

export class SetReactionDto {
  @ApiProperty({ enum: ReactionType, enumName: 'ReactionType' })
  @IsEnum(ReactionType)
  type!: ReactionType;
}
