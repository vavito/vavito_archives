import { CurrentUser } from '@api/core/auth/decorators/current-user.decorator';
import { Roles } from '@api/core/auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '@api/core/auth/interfaces/authenticated-user.interface';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { UserRole } from '@api/generated/prisma/client';
import { ListCampaignsQueryDto } from '@api/modules/newsletter/dto/query/list-campaigns-query.dto';
import { CreateCampaignDto } from '@api/modules/newsletter/dto/request/create-campaign.dto';
import { UpdateCampaignDto } from '@api/modules/newsletter/dto/request/update-campaign.dto';
import {
  EmailCampaignAdminDto,
  PaginatedEmailCampaignsDto,
} from '@api/modules/newsletter/dto/response/email-campaign-response.dto';
import { CampaignsService } from '@api/modules/newsletter/services/campaigns.service';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

@Roles(UserRole.ADMIN)
@ApiBearerAuth('supabase-jwt')
@ApiTags('Admin Newsletter')
@ApiBadRequestResponse({ description: 'Dados ou parâmetros inválidos.', type: ErrorResponseDto })
@ApiUnauthorizedResponse({ description: 'Autenticação necessária.', type: ErrorResponseDto })
@ApiForbiddenResponse({ description: 'Acesso exclusivo de administrador.', type: ErrorResponseDto })
@Controller('admin/newsletter/campaigns')
export class AdminCampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista campanhas da newsletter' })
  @ApiOkResponse({ type: PaginatedEmailCampaignsDto })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListCampaignsQueryDto,
  ): Promise<PaginatedEmailCampaignsDto> {
    return this.campaignsService.list(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta campanha e seu preview congelado' })
  @ApiOkResponse({ type: EmailCampaignAdminDto })
  @ApiNotFoundResponse({ description: 'Campanha não encontrada.', type: ErrorResponseDto })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<EmailCampaignAdminDto> {
    return this.campaignsService.get(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria rascunho de campanha para um artigo publicado' })
  @ApiCreatedResponse({ type: EmailCampaignAdminDto })
  @ApiConflictResponse({ description: 'O post não está publicado.', type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Conteúdo inválido.', type: ErrorResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCampaignDto,
  ): Promise<EmailCampaignAdminDto> {
    return this.campaignsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita uma campanha ainda em rascunho' })
  @ApiOkResponse({ type: EmailCampaignAdminDto })
  @ApiConflictResponse({ description: 'A campanha não está editável.', type: ErrorResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCampaignDto,
  ): Promise<EmailCampaignAdminDto> {
    return this.campaignsService.update(user.id, id, dto);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Envia uma campanha uma única vez' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: true,
    schema: { format: 'uuid', type: 'string' },
  })
  @ApiAcceptedResponse({ type: EmailCampaignAdminDto })
  @ApiConflictResponse({ description: 'Envio duplicado ou indisponível.', type: ErrorResponseDto })
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ): Promise<EmailCampaignAdminDto> {
    return this.campaignsService.send(user.id, id, idempotencyKey);
  }
}
