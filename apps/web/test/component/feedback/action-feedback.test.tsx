import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionFeedback } from '@web/components/feedback/action-feedback';

describe('feedback flutuante de ações', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('aparece imediatamente e desaparece após o tempo de leitura', async () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <ActionFeedback
        feedback={{ id: 1, message: 'Não foi possível salvar.', tone: 'error' }}
        onDismiss={onDismiss}
      />,
    );

    const feedback = screen.getByRole('alert');
    expect(feedback).toHaveClass('action-feedback-enter');
    expect(feedback.parentElement).toHaveClass('fixed', 'left-1/2', '-translate-x-1/2');
    expect(feedback.parentElement?.parentElement).toBe(document.body);

    await act(() => vi.advanceTimersByTimeAsync(4_500));
    expect(feedback).toHaveClass('action-feedback-exit');

    await act(() => vi.advanceTimersByTimeAsync(240));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
