import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AboutPageContent } from '@web/features/institutional/components/about-page-content';
import { PrivacyPageContent } from '@web/features/institutional/components/privacy-page-content';

describe('páginas institucionais', () => {
  it('apresenta o autor, o propósito e os acessos para artigos e contato', () => {
    render(<AboutPageContent />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Construir, entender e registrar.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Oi, eu sou o João Victor.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar os artigos' })).toHaveAttribute(
      'href',
      '/artigos',
    );
    expect(screen.getByRole('link', { name: 'Entrar em contato' })).toHaveAttribute(
      'href',
      '/contato',
    );
  });

  it('documenta conta, participação, newsletter, contato e serviços essenciais', () => {
    render(<PrivacyPageContent />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Seus dados, sem letras miúdas.' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Sua senha é protegida durante o acesso/i)).toBeInTheDocument();
    expect(
      screen.getByText(/comentários, respostas, reações e artigos salvos/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/email, origem e momento do consentimento/i)).toBeInTheDocument();
    expect(screen.getByText(/nome, email e mensagem enviados/i)).toBeInTheDocument();
    expect(screen.getByText(/provedores especializados em serviços/i)).toBeInTheDocument();
    expect(screen.queryByText(/Supabase|Resend|Vercel|Render/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Seus controles' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Segurança e retenção técnica' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'página de contato' })).toHaveAttribute(
      'href',
      '/contato',
    );
  });
});
