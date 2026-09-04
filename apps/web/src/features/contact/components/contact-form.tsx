'use client';

import { ApiClientError } from '@vavito/api-client';
import { Button, Input, Textarea } from '@vavito/ui';
import { CheckCircle2, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { CONTACT_LIMITS, validateContactMessage } from '../schemas/contact-message.schema';
import { sendContactMessage } from '../services/send-contact-message';
import type { ContactField, ContactFieldErrors } from '../types/contact.types';

type SubmissionState =
  { status: 'idle' } | { message: string; status: 'error' | 'success' } | { status: 'submitting' };

function focusFirstInvalidField(form: HTMLFormElement, errors: ContactFieldErrors): void {
  const field = (['name', 'email', 'message'] as const).find((name) => errors[name]);
  const control = field ? form.elements.namedItem(field) : null;

  if (control instanceof HTMLElement) {
    control.focus();
  }
}

export function ContactForm() {
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [state, setState] = useState<SubmissionState>({ status: 'idle' });

  function clearFieldError(field: ContactField) {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = validateContactMessage(new FormData(form));

    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      setState({ status: 'idle' });
      focusFirstInvalidField(form, result.errors);
      return;
    }

    setErrors({});
    setState({ status: 'submitting' });

    try {
      const response = await sendContactMessage(result.values);
      form.reset();
      setState({ message: response.message, status: 'success' });
    } catch (error) {
      setState({
        message:
          error instanceof ApiClientError
            ? error.message
            : 'Não foi possível enviar sua mensagem agora. Tente novamente.',
        status: 'error',
      });
    }
  }

  const isSubmitting = state.status === 'submitting';

  return (
    <form
      className="motion-card bg-surface-card grid gap-5 rounded-3xl border border-border p-5 sm:p-7"
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Input
        autoComplete="name"
        disabled={isSubmitting}
        error={errors.name}
        label="Nome"
        maxLength={CONTACT_LIMITS.name.max}
        name="name"
        onChange={() => clearFieldError('name')}
        placeholder="Como podemos chamar você?"
        required
      />
      <Input
        autoComplete="email"
        disabled={isSubmitting}
        error={errors.email}
        label="E-mail"
        maxLength={CONTACT_LIMITS.email}
        name="email"
        onChange={() => clearFieldError('email')}
        placeholder="voce@exemplo.com"
        required
        type="email"
      />
      <Textarea
        description="Entre 10 e 5.000 caracteres. Não inclua senhas ou informações sensíveis."
        disabled={isSubmitting}
        error={errors.message}
        label="Mensagem"
        maxLength={CONTACT_LIMITS.message.max}
        name="message"
        onChange={() => clearFieldError('message')}
        placeholder="Conte o que você gostaria de conversar."
        required
        rows={7}
      />

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-neutral-500 text-xs leading-relaxed">
          A resposta será enviada para o e-mail informado.
        </p>
        <Button className="w-full sm:w-auto" disabled={isSubmitting} size="large" type="submit">
          {isSubmitting ? <LoadingSpinner /> : null}
          {isSubmitting ? 'Enviando…' : 'Enviar mensagem'}
          {!isSubmitting ? <Send aria-hidden="true" /> : null}
        </Button>
      </div>

      {state.status === 'success' ? (
        <p
          aria-live="polite"
          className="feedback-enter text-accent flex items-center gap-2 text-sm"
          role="status"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" />
          {state.message}
        </p>
      ) : null}
      {state.status === 'error' ? (
        <p aria-live="assertive" className="feedback-enter text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
