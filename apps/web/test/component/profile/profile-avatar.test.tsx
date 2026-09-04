import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileAvatar } from '@web/features/profile/components/profile-avatar';

describe('avatar do perfil', () => {
  it('mantém uma animação vertical dentro da forma enquanto a imagem carrega', async () => {
    render(
      <ProfileAvatar avatarUrl="https://cdn.example.com/avatar.webp" displayName="João Victor" />,
    );

    expect(screen.getByRole('status', { name: 'Carregando foto do perfil' })).toHaveClass(
      'profile-avatar-loading',
    );

    fireEvent.load(screen.getByAltText('Foto de João Victor'));

    await waitFor(() => {
      expect(
        screen.queryByRole('status', { name: 'Carregando foto do perfil' }),
      ).not.toBeInTheDocument();
    });
  });

  it('usa as iniciais quando não existe imagem', () => {
    render(<ProfileAvatar avatarUrl={null} displayName="João Victor" />);

    expect(screen.getByLabelText('Iniciais de João Victor')).toHaveTextContent('JV');
  });
});
