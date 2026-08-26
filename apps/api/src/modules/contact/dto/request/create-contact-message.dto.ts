import {
  MAX_CONTACT_EMAIL_LENGTH,
  MAX_CONTACT_MESSAGE_LENGTH,
  MAX_CONTACT_NAME_LENGTH,
  MAX_CONTACT_SUBJECT_LENGTH,
  MIN_CONTACT_MESSAGE_LENGTH,
  MIN_CONTACT_NAME_LENGTH,
} from '@api/modules/contact/contact.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

function trim(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class CreateContactMessageDto {
  @ApiProperty({ example: 'João Victor', maxLength: MAX_CONTACT_NAME_LENGTH })
  @Transform(({ value }: { value: unknown }) => trim(value))
  @IsString()
  @MinLength(MIN_CONTACT_NAME_LENGTH)
  @MaxLength(MAX_CONTACT_NAME_LENGTH)
  name!: string;

  @ApiProperty({ example: 'leitor@example.com', maxLength: MAX_CONTACT_EMAIL_LENGTH })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsEmail()
  @MaxLength(MAX_CONTACT_EMAIL_LENGTH)
  email!: string;

  @ApiPropertyOptional({ example: 'Sugestão de pauta', maxLength: MAX_CONTACT_SUBJECT_LENGTH })
  @Transform(({ value }: { value: unknown }) => trim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_CONTACT_SUBJECT_LENGTH)
  subject?: string;

  @ApiProperty({
    example: 'Gostaria de sugerir uma pauta para o próximo artigo.',
    maxLength: MAX_CONTACT_MESSAGE_LENGTH,
    minLength: MIN_CONTACT_MESSAGE_LENGTH,
  })
  @Transform(({ value }: { value: unknown }) => trim(value))
  @IsString()
  @MinLength(MIN_CONTACT_MESSAGE_LENGTH)
  @MaxLength(MAX_CONTACT_MESSAGE_LENGTH)
  message!: string;
}
