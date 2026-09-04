import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { Input, Textarea } from '@vavito/ui';

function expectContinuousAccentFocus(control: ReactElement) {
  render(control);

  const field = screen.getByRole('textbox');

  expect(field).toHaveClass(
    'focus-visible:border-accent',
    'focus-visible:ring-inset',
    'focus-visible:ring-accent',
  );
  expect(field.className).not.toContain('ring-offset');
}

describe('controles de formulário', () => {
  it('mantém o foco accent contínuo no input', () => {
    expectContinuousAccentFocus(<Input label="E-mail" />);
  });

  it('mantém o foco accent contínuo na área de texto', () => {
    expectContinuousAccentFocus(<Textarea label="Mensagem" />);
  });
});
