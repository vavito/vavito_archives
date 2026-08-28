import { Public } from '@api/core/auth/decorators/public.decorator';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { RATE_LIMITS } from '@api/core/http/security/http-security.constants';
import { CreateContactMessageDto } from '@api/modules/contact/dto/request/create-contact-message.dto';
import { ContactAcceptedResponseDto } from '@api/modules/contact/dto/response/contact-accepted-response.dto';
import { ContactService } from '@api/modules/contact/services/contact.service';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@Public()
@Throttle({ default: RATE_LIMITS.contact })
@ApiTags('Contact')
@ApiTooManyRequestsResponse({
  description: 'Limite de mensagens de contato excedido.',
  type: ErrorResponseDto,
})
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Envia uma mensagem de contato ao autor' })
  @ApiAcceptedResponse({ type: ContactAcceptedResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Dados inválidos.', type: ErrorResponseDto })
  create(@Body() dto: CreateContactMessageDto): Promise<ContactAcceptedResponseDto> {
    return this.contactService.create(dto);
  }
}
