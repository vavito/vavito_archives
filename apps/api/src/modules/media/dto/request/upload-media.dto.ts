import { Transform, type TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

function normalizeAltText(params: TransformFnParams): unknown {
  const value: unknown = params.value;

  return typeof value === 'string' ? value.trim().replaceAll(/\s+/g, ' ') : value;
}

export class UploadMediaDto {
  @ApiProperty({ example: 'Diagrama da arquitetura da aplicação' })
  @Transform(normalizeAltText)
  @IsString()
  @IsNotEmpty()
  altText!: string;
}
