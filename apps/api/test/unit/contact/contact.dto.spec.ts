import { CreateContactMessageDto } from '@api/modules/contact/dto/request/create-contact-message.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('CreateContactMessageDto', () => {
  it('normaliza e aceita uma mensagem válida', async () => {
    const dto = plainToInstance(CreateContactMessageDto, {
      email: '  Leitor@Example.COM ',
      message: '  Gostaria de sugerir uma nova pauta.  ',
      name: '  João Victor  ',
      subject: '  Sugestão  ',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      email: 'leitor@example.com',
      message: 'Gostaria de sugerir uma nova pauta.',
      name: 'João Victor',
      subject: 'Sugestão',
    });
  });

  it.each([
    { email: 'inválido', message: 'Mensagem válida.', name: 'Leitor' },
    { email: 'leitor@example.com', message: 'curta', name: 'Leitor' },
    { email: 'leitor@example.com', message: 'Mensagem válida.', name: 'A' },
  ])('rejeita dados inválidos', async (payload) => {
    await expect(
      validate(plainToInstance(CreateContactMessageDto, payload)),
    ).resolves.not.toHaveLength(0);
  });
});
