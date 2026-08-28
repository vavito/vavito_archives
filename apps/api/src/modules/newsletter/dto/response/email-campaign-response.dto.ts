import { CampaignStatus } from '@api/modules/newsletter/domain/enums/campaign-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CampaignPostSnapshotDto {
  @ApiProperty({ example: 'Resumo congelado do artigo.' })
  excerpt!: string;

  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000010', format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '2026-08-24T12:00:00.000Z', format: 'date-time' })
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

  @ApiProperty({ example: '2026-08-25T10:00:00.000Z', format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000004', format: 'uuid' })
  createdById!: string;

  @ApiProperty({ example: null, nullable: true })
  failureReason!: string | null;

  @ApiProperty({
    description: 'HTML congelado usado como preview e base para o envio.',
    example: '<article><h1>Arquivos e memória digital</h1></article>',
  })
  htmlSnapshot!: string;

  @ApiProperty({ example: '019c2d62-6e90-7000-8000-000000000050', format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: '019c2d62-6e90-7000-8000-000000000051',
    format: 'uuid',
    nullable: true,
  })
  idempotencyKey!: string | null;

  @ApiProperty({ type: CampaignPostSnapshotDto })
  postSnapshot!: CampaignPostSnapshotDto;

  @ApiProperty({ example: 'Uma nova leitura já está disponível.' })
  previewText!: string;

  @ApiProperty({ example: 're_123456789', nullable: true })
  resendId!: string | null;

  @ApiProperty({
    example: '2026-08-25T13:00:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  sendStartedAt!: string | null;

  @ApiProperty({
    example: '2026-08-25T13:01:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  sentAt!: string | null;

  @ApiProperty({
    enum: CampaignStatus,
    enumName: 'CampaignStatus',
    example: CampaignStatus.SENT,
  })
  status!: CampaignStatus;

  @ApiProperty({ example: 'Novo artigo: Arquivos e memória digital' })
  subject!: string;

  @ApiProperty({ example: '2026-08-25T13:01:00.000Z', format: 'date-time' })
  updatedAt!: string;
}

export class CampaignPaginationMetaDto {
  @ApiProperty({ example: 20, minimum: 1 })
  limit!: number;

  @ApiProperty({ example: 1, minimum: 1 })
  page!: number;

  @ApiProperty({ example: 42, minimum: 0 })
  total!: number;

  @ApiProperty({ example: 3, minimum: 0 })
  totalPages!: number;
}

export class PaginatedEmailCampaignsDto {
  @ApiProperty({ type: [EmailCampaignAdminDto] })
  items!: EmailCampaignAdminDto[];

  @ApiProperty({ type: CampaignPaginationMetaDto })
  meta!: CampaignPaginationMetaDto;
}
