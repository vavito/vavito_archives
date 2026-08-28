import { Public } from '@api/core/auth/decorators/public.decorator';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { RATE_LIMITS } from '@api/core/http/security/http-security.constants';
import { MailWebhookVerifier } from '@api/core/mail/services/mail-webhook-verifier.service';
import { WebhookReceivedResponseDto } from '@api/modules/newsletter/dto/response/webhook-received-response.dto';
import { throwResendWebhookException } from '@api/modules/newsletter/errors/resend-webhook.exception';
import { NewsletterWebhooksService } from '@api/modules/newsletter/services/newsletter-webhooks.service';
import { Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

function singleHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

@Public()
@ApiTags('Webhooks')
@Controller('webhooks/resend')
export class ResendWebhooksController {
  constructor(
    private readonly verifier: MailWebhookVerifier,
    private readonly webhooksService: NewsletterWebhooksService,
  ) {}

  @Post()
  @Throttle({ default: RATE_LIMITS.resendWebhook })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Processa eventos assinados do Resend' })
  @ApiHeader({
    description: 'Identificador único do evento enviado pelo Resend.',
    name: 'svix-id',
    required: true,
    schema: { example: 'msg_2bL7C4Yp9W3x', type: 'string' },
  })
  @ApiHeader({
    description: 'Timestamp Unix usado na verificação da assinatura.',
    name: 'svix-timestamp',
    required: true,
    schema: { example: '1787689200', type: 'string' },
  })
  @ApiHeader({
    description: 'Assinatura criptográfica do corpo bruto.',
    name: 'svix-signature',
    required: true,
    schema: { example: 'v1,base64-signature', type: 'string' },
  })
  @ApiBody({
    schema: {
      additionalProperties: true,
      example: {
        created_at: '2026-08-25T20:15:00.000Z',
        data: { email_id: 're_123456789' },
        type: 'email.delivered',
      },
      type: 'object',
    },
  })
  @ApiOkResponse({ type: WebhookReceivedResponseDto })
  @ApiBadRequestResponse({ description: 'Payload inválido.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Assinatura inválida.', type: ErrorResponseDto })
  @ApiTooManyRequestsResponse({
    description: 'Limite de eventos recebidos excedido.',
    type: ErrorResponseDto,
  })
  async process(
    @Req() request: RawBodyRequest<object>,
    @Headers('svix-id') id: string | string[] | undefined,
    @Headers('svix-timestamp') timestamp: string | string[] | undefined,
    @Headers('svix-signature') signature: string | string[] | undefined,
  ): Promise<WebhookReceivedResponseDto> {
    const headerId = singleHeader(id);
    const headerSignature = singleHeader(signature);
    const headerTimestamp = singleHeader(timestamp);
    const event = this.verify({
      headers: {
        ...(headerId ? { id: headerId } : {}),
        ...(headerSignature ? { signature: headerSignature } : {}),
        ...(headerTimestamp ? { timestamp: headerTimestamp } : {}),
      },
      payload: request.rawBody?.toString('utf8') ?? '',
    });

    await this.webhooksService.process(event);
    return { received: true };
  }

  private verify(input: Parameters<MailWebhookVerifier['verify']>[0]) {
    try {
      return this.verifier.verify(input);
    } catch (error) {
      throwResendWebhookException(error);
    }
  }
}
