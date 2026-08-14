import { Equals } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const DELETE_ACCOUNT_CONFIRMATION = 'EXCLUIR MINHA CONTA';

export class DeleteAccountDto {
  @ApiProperty({ enum: [DELETE_ACCOUNT_CONFIRMATION] })
  @Equals(DELETE_ACCOUNT_CONFIRMATION)
  confirmation!: typeof DELETE_ACCOUNT_CONFIRMATION;
}
