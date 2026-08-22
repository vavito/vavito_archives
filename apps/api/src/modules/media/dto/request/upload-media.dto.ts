import { Transform, type TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

function normalizeAltText(params: TransformFnParams): unknown {
  const value: unknown = params.value;

  return typeof value === 'string' ? value.trim().replaceAll(/\s+/g, ' ') : value;
}

export class UploadMediaDto {
  @Transform(normalizeAltText)
  @IsString()
  @IsNotEmpty()
  altText!: string;
}
