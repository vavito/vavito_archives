import { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CampaignPostSnapshotDto {
  @ApiProperty({ example: 'Resumo congelado do artigo.' })
  excerpt!: string;

  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date-time' })
  publishedAt!: string;

  @ApiProperty({ example: 7 })
  readingTimeMinutes!: number;

  @ApiProperty({ example: 'arquivos-e-memoria-digital' })
  slug!: string;

  @ApiProperty({ example: 'Arquivos e memória digital' })
  title!: string;
}

export class EmailCampaignAdminDto {
  @ApiProperty({ example: 42 })
  audienceCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'uuid' })
  createdById!: string;

  @ApiProperty({ nullable: true })
  failureReason!: string | null;

  @ApiProperty({ description: 'HTML congelado usado como preview e base para o envio.' })
  htmlSnapshot!: string;

  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  idempotencyKey!: string | null;

  @ApiProperty({ type: CampaignPostSnapshotDto })
  postSnapshot!: CampaignPostSnapshotDto;

  @ApiProperty({ example: 'Uma nova leitura já está disponível.' })
  previewText!: string;

  @ApiProperty({ nullable: true })
  resendId!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true })
  sendStartedAt!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true })
  sentAt!: string | null;

  @ApiProperty({ enum: CampaignStatus })
  status!: CampaignStatus;

  @ApiProperty({ example: 'Novo artigo: Arquivos e memória digital' })
  subject!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

export class CampaignPaginationMetaDto {
  @ApiProperty()
  limit!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedEmailCampaignsDto {
  @ApiProperty({ type: [EmailCampaignAdminDto] })
  items!: EmailCampaignAdminDto[];

  @ApiProperty({ type: CampaignPaginationMetaDto })
  meta!: CampaignPaginationMetaDto;
}
