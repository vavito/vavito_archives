import { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';
import { AdminPaginationQueryDto } from '@api/shared/pagination/dto/pagination-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class ListCampaignsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
