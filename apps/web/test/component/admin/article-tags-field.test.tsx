import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ArticleTagsField } from '@web/features/admin/editor/article-tags-field';

describe('tópicos do artigo', () => {
  it('só confirma um tópico após vírgula, Enter ou saída do campo', () => {
    const onChange = vi.fn();
    const { rerender } = render(<ArticleTagsField onChange={onChange} tagNames={[]} />);
    const input = screen.getByLabelText('Tópicos do artigo');

    fireEvent.change(input, { target: { value: 'NestJS' } });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith(['NestJS']);

    rerender(<ArticleTagsField onChange={onChange} tagNames={['NestJS']} />);
    fireEvent.change(input, { target: { value: 'TypeScript,' } });
    expect(onChange).toHaveBeenLastCalledWith(['NestJS', 'TypeScript']);
  });

  it('permite remover um tópico confirmado', () => {
    const onChange = vi.fn();
    render(<ArticleTagsField onChange={onChange} tagNames={['NestJS', 'TypeScript']} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remover tópico NestJS' }));
    expect(onChange).toHaveBeenCalledWith(['TypeScript']);
  });
});
