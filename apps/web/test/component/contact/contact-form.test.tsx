import { ApiClientError } from '@vavito/api-client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ContactForm } from '@web/features/contact/components/contact-form';

const contactMocks = vi.hoisted(() => ({
  sendContactMessage: vi.fn(),
}));

vi.mock('@web/features/contact/services/send-contact-message', () => contactMocks);

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Pessoa Leitora' } });
  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'LEITOR@EXAMPLE.COM ' },
  });
  fireEvent.change(screen.getByLabelText('Mensagem'), {
    target: { value: '  Gostaria de sugerir uma pauta para o blog.  ' },
  });
}

describe('ContactForm', () => {
  beforeEach(() => {
    contactMocks.sendContactMessage.mockResolvedValue({
      message: 'Mensagem recebida. Retornaremos assim que possível.',
    });
  });

  it('valida os três campos antes de consultar a API', () => {
    render(<ContactForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    expect(screen.getByText('Informe seu nome com pelo menos 2 caracteres.')).toBeInTheDocument();
    expect(screen.getByText('Informe um endereço de e-mail válido.')).toBeInTheDocument();
    expect(
      screen.getByText('Escreva uma mensagem com pelo menos 10 caracteres.'),
    ).toBeInTheDocument();
    expect(contactMocks.sendContactMessage).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nome')).toHaveFocus();
  });

  it('normaliza os dados e apresenta o feedback da resposta 202', async () => {
    render(<ContactForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    await waitFor(() => {
      expect(contactMocks.sendContactMessage).toHaveBeenCalledWith({
        email: 'leitor@example.com',
        message: 'Gostaria de sugerir uma pauta para o blog.',
        name: 'Pessoa Leitora',
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Mensagem recebida. Retornaremos assim que possível.',
    );
    expect(screen.getByLabelText('Nome')).toHaveValue('');
  });

  it('apresenta a mensagem segura retornada pela API', async () => {
    contactMocks.sendContactMessage.mockRejectedValueOnce(
      new ApiClientError({
        code: 'RATE_LIMIT_EXCEEDED',
        details: null,
        message: 'Muitas solicitações. Tente novamente mais tarde.',
        path: '/api/v1/contact',
        requestId: null,
        statusCode: 429,
        timestamp: null,
      }),
    );
    render(<ContactForm />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar mensagem' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Muitas solicitações. Tente novamente mais tarde.',
    );
  });
});
