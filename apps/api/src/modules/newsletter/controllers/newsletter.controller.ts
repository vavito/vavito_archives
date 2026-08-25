import { Public } from '@api/core/auth/decorators/public.decorator';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { ConfirmSubscriptionDto } from '@api/modules/newsletter/dto/request/confirm-subscription.dto';
import { SubscribeNewsletterDto } from '@api/modules/newsletter/dto/request/subscribe-newsletter.dto';
import { UnsubscribeDto } from '@api/modules/newsletter/dto/request/unsubscribe.dto';
import {
  SubscriptionAcceptedResponseDto,
  SubscriptionConfirmedResponseDto,
} from '@api/modules/newsletter/dto/response/subscription-response.dto';
import { NewsletterRateLimitGuard } from '@api/modules/newsletter/guards/newsletter-rate-limit.guard';
import { NewsletterService } from '@api/modules/newsletter/services/newsletter.service';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiGoneResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

@Public()
@UseGuards(NewsletterRateLimitGuard)
@ApiTags('Newsletter')
@ApiTooManyRequestsResponse({
  description: 'Limite de solicitações da newsletter excedido.',
  type: ErrorResponseDto,
})
@Controller('newsletter/subscriptions')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicita inscrição com double opt-in' })
  @ApiAcceptedResponse({ type: SubscriptionAcceptedResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Dados inválidos.', type: ErrorResponseDto })
  subscribe(@Body() dto: SubscribeNewsletterDto): Promise<SubscriptionAcceptedResponseDto> {
    return this.newsletterService.subscribe(dto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirma uma inscrição pendente' })
  @ApiOkResponse({ type: SubscriptionConfirmedResponseDto })
  @ApiBadRequestResponse({ description: 'Token inválido.', type: ErrorResponseDto })
  @ApiGoneResponse({ description: 'Token expirado.', type: ErrorResponseDto })
  confirm(@Body() dto: ConfirmSubscriptionDto): Promise<SubscriptionConfirmedResponseDto> {
    return this.newsletterService.confirm(dto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancela uma inscrição de forma idempotente' })
  @ApiNoContentResponse()
  unsubscribe(@Body() dto: UnsubscribeDto): Promise<void> {
    return this.newsletterService.unsubscribe(dto);
  }
}
