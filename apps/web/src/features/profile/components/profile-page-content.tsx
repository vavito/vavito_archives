'use client';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  buttonVariants,
  cn,
} from '@vavito/ui';
import { Camera, KeyRound, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import {
  ActionFeedback,
  type ActionFeedbackMessage,
} from '@web/components/feedback/action-feedback';
import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import {
  normalizeDisplayName,
  PROFILE_LIMITS,
  validateAvatar,
  validateDisplayName,
} from '../schemas/profile.schema';
import {
  clearDeletedAccountSession,
  deleteProfileAccount,
  removeProfileAvatar,
  SafeProfileActionError,
  updateProfileName,
  uploadProfileAvatar,
} from '../services/profile.service';
import { DELETE_ACCOUNT_CONFIRMATION } from '../services/profile-api.service';
import type { Profile, ProfileOperation } from '../types/profile.types';
import { ProfileAvatar } from './profile-avatar';

interface ProfilePageContentProps {
  email: string;
  initialProfile: Profile;
}

function safeErrorMessage(error: unknown, fallback: string): string {
  return error instanceof SafeProfileActionError ? error.message : fallback;
}

export function ProfilePageContent({ email, initialProfile }: Readonly<ProfilePageContentProps>) {
  const router = useRouter();
  const feedbackIdRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmation, setConfirmation] = useState('');
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [feedback, setFeedback] = useState<ActionFeedbackMessage | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [operation, setOperation] = useState<ProfileOperation>(null);
  const [profile, setProfile] = useState(initialProfile);

  const isBusy = operation !== null;
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  function showFeedback(message: string, tone: ActionFeedbackMessage['tone']) {
    feedbackIdRef.current += 1;
    setFeedback({ id: feedbackIdRef.current, message, tone });
  }

  async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateDisplayName(displayName);

    if (error) {
      setNameError(error);
      return;
    }

    const normalizedName = normalizeDisplayName(displayName);
    setNameError(null);
    dismissFeedback();
    setOperation('name');

    try {
      const updatedProfile = await updateProfileName(normalizedName);
      setProfile(updatedProfile);
      setDisplayName(updatedProfile.displayName);
      showFeedback('Seu nome foi atualizado.', 'success');
      router.refresh();
    } catch (error) {
      showFeedback(safeErrorMessage(error, 'Não foi possível atualizar seu nome agora.'), 'error');
    } finally {
      setOperation(null);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    const error = validateAvatar(file);
    if (error) {
      showFeedback(error, 'error');
      return;
    }

    dismissFeedback();
    setOperation('avatar');

    try {
      const updatedProfile = await uploadProfileAvatar(file);
      setProfile(updatedProfile);
      showFeedback('Sua foto foi atualizada.', 'success');
      router.refresh();
    } catch (error) {
      showFeedback(safeErrorMessage(error, 'Não foi possível atualizar sua foto agora.'), 'error');
    } finally {
      setOperation(null);
    }
  }

  async function handleAvatarRemoval() {
    dismissFeedback();
    setOperation('avatar');

    try {
      await removeProfileAvatar();
      setProfile((current) => ({ ...current, avatarUrl: null }));
      showFeedback('Sua foto foi removida.', 'success');
      router.refresh();
    } catch (error) {
      showFeedback(safeErrorMessage(error, 'Não foi possível remover sua foto agora.'), 'error');
    } finally {
      setOperation(null);
    }
  }

  async function handleAccountDeletion() {
    if (confirmation !== DELETE_ACCOUNT_CONFIRMATION) {
      return;
    }

    dismissFeedback();
    setOperation('delete');

    try {
      await deleteProfileAccount();
      await clearDeletedAccountSession();
      router.replace('/');
      router.refresh();
    } catch (error) {
      showFeedback(safeErrorMessage(error, 'Não foi possível excluir sua conta agora.'), 'error');
      setOperation(null);
    }
  }

  return (
    <div className="grid gap-6">
      {feedback ? <ActionFeedback feedback={feedback} onDismiss={dismissFeedback} /> : null}

      <section className="motion-card bg-surface-card grid gap-6 rounded-2xl border border-border p-5 sm:p-6">
        <header className="grid gap-1">
          <h2 className="text-lg font-semibold text-neutral-100">Foto do perfil</h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Ela aparece junto aos seus comentários. Use JPG, PNG ou WebP de até 2 MB.
          </p>
        </header>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProfileAvatar avatarUrl={profile.avatarUrl} displayName={profile.displayName} />

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              aria-label="Escolher nova foto do perfil"
              className="sr-only"
              disabled={isBusy}
              onChange={(event) => void handleAvatarChange(event)}
              type="file"
            />
            <Button
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
            >
              {operation === 'avatar' ? <LoadingSpinner /> : <Camera aria-hidden="true" />}
              {profile.avatarUrl ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            {profile.avatarUrl ? (
              <Button disabled={isBusy} onClick={() => void handleAvatarRemoval()} variant="ghost">
                Remover foto
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="motion-card bg-surface-card grid gap-6 rounded-2xl border border-border p-5 sm:p-6">
        <header className="grid gap-1">
          <h2 className="text-lg font-semibold text-neutral-100">Informações públicas</h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Este é o nome exibido nas suas interações no site.
          </p>
        </header>

        <form className="grid gap-4" noValidate onSubmit={(event) => void handleNameSubmit(event)}>
          <Input
            autoComplete="name"
            disabled={isBusy}
            error={nameError}
            label="Nome"
            maxLength={PROFILE_LIMITS.displayName.max}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setNameError(null);
            }}
            value={displayName}
          />
          <Button className="justify-self-start" disabled={isBusy} type="submit">
            {operation === 'name' ? <LoadingSpinner /> : null}
            {operation === 'name' ? 'Salvando…' : 'Salvar nome'}
          </Button>
        </form>
      </section>

      <section className="motion-card bg-surface-card grid gap-5 rounded-2xl border border-border p-5 sm:p-6">
        <header className="grid gap-1">
          <h2 className="text-lg font-semibold text-neutral-100">Acesso e segurança</h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Seu e-mail de acesso é <strong className="font-medium text-neutral-200">{email}</strong>
            .
          </p>
        </header>
        <Link
          className={cn(buttonVariants({ variant: 'secondary' }), 'justify-self-start')}
          href="/auth/forgot-password"
        >
          <KeyRound aria-hidden="true" />
          Alterar senha
        </Link>
      </section>

      <section className="motion-card grid gap-5 rounded-2xl border border-destructive-border bg-destructive-hover/30 p-5 sm:p-6">
        <header className="grid gap-1">
          <h2 className="text-lg font-semibold text-destructive">Zona de perigo</h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            A exclusão encerra seu acesso e remove permanentemente os dados privados da conta.
          </p>
        </header>

        <Dialog
          onOpenChange={(open) => {
            if (!open) {
              setConfirmation('');
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="justify-self-start" disabled={isBusy} variant="danger">
              <Trash2 aria-hidden="true" />
              Excluir conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir sua conta?</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Para confirmar, digite{' '}
                <strong className="text-neutral-200">{DELETE_ACCOUNT_CONFIRMATION}</strong>.
              </DialogDescription>
            </DialogHeader>
            <Input
              autoComplete="off"
              disabled={operation === 'delete'}
              label="Confirmação"
              onChange={(event) => setConfirmation(event.target.value)}
              value={confirmation}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button disabled={operation === 'delete'} variant="ghost">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                disabled={operation === 'delete' || confirmation !== DELETE_ACCOUNT_CONFIRMATION}
                onClick={() => void handleAccountDeletion()}
                variant="danger"
              >
                {operation === 'delete' ? <LoadingSpinner /> : <Trash2 aria-hidden="true" />}
                {operation === 'delete' ? 'Excluindo…' : 'Excluir definitivamente'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
