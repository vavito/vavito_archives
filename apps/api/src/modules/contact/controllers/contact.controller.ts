import { Public } from '@api/core/auth/decorators/public.decorator';
import { ErrorResponseDto } from '@api/core/http/dto/error-response.dto';
import { CreateContactMessageDto } from '@api/modules/contact/dto/request/create-contact-message.dto';
import { ContactAcceptedResponseDto } from '@api/modules/contact/dto/response/contact-accepted-response.dto';
import { ContactRateLimitGuard } from '@api/modules/contact/guards/contact-rate-limit.guard';
import { ContactService } from '@api/modules/contact/services/contact.service';
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

@Public()
@UseGuards(ContactRateLimitGuard)
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
