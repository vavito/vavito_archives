import { Transform } from 'class-transformer';
import { Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeletePostDto {
  @ApiProperty({
    description: 'Confirma explicitamente a exclusão permanente do post.',
    example: true,
  })
  @Transform(({ value }: { value: unknown }) => value === true || value === 'true')
  @Equals(true)
  confirm!: true;
}
