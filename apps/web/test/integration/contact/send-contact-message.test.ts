import type { ApiClient } from '@vavito/api-client';
import { describe, expect, it, vi } from 'vitest';

import { sendContactMessage } from '@web/features/contact/services/send-contact-message';

const message = {
  email: 'leitor@example.com',
  message: 'Gostaria de sugerir uma pauta para o blog.',
  name: 'Pessoa Leitora',
};

describe('sendContactMessage', () => {
  it('envia o formulário e preserva o feedback aceito pela API', async () => {
    const accepted = { message: 'Mensagem recebida. Retornaremos assim que possível.' };
    const post = vi.fn().mockResolvedValue({ data: accepted });
    const client = { POST: post } as unknown as ApiClient;

    await expect(sendContactMessage(message, client)).resolves.toEqual(accepted);
    expect(post).toHaveBeenCalledWith('/api/v1/contact', { body: message });
  });

  it('interrompe o fluxo quando a API não entrega a confirmação esperada', async () => {
    const client = {
      POST: vi.fn().mockResolvedValue({ data: undefined }),
    } as unknown as ApiClient;

    await expect(sendContactMessage(message, client)).rejects.toThrow(
      'Não foi possível confirmar o envio da mensagem.',
    );
  });
});
