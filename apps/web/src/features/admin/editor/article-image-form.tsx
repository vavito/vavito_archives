'use client';

import { Button, Input } from '@vavito/ui';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

import { validateArticleImage } from '../schemas/article-image.schema';
import type { UploadArticleImage, UploadedArticleImage } from '../types/admin-media.types';

interface ArticleImageFormProps {
  ariaLabel?: string;
  onClose: () => void;
  onUploaded: (image: UploadedArticleImage) => void;
  submitLabel?: string;
  title?: string;
  uploadImage: UploadArticleImage;
}

function friendlyUploadError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível enviar a imagem agora. Tente novamente.';
}

export function ArticleImageForm({
  ariaLabel = 'Inserir imagem',
  onClose,
  onUploaded,
  submitLabel = 'Inserir imagem',
  title = 'Inserir imagem no artigo',
  uploadImage,
}: Readonly<ArticleImageFormProps>) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [altText, setAltText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  function closeForm() {
    abortControllerRef.current?.abort();
    onClose();
  }

  async function submitImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateArticleImage({ altText, file });

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      const uploadedImage = await uploadImage(validation.data.file, validation.data.altText, {
        onProgress: ({ percentage }) => setProgress(percentage),
        signal: abortController.signal,
      });
      onUploaded(uploadedImage);
    } catch (uploadError) {
      if (!abortController.signal.aborted) {
        setError(friendlyUploadError(uploadError));
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsUploading(false);
      }
      abortControllerRef.current = null;
    }
  }

  return (
    <form
      aria-label={ariaLabel}
      className="border-divider grid gap-4 border-t px-3 py-4 sm:px-4"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeForm();
        }
      }}
      noValidate
      onSubmit={(event) => void submitImage(event)}
      role="dialog"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-neutral-100">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            JPG, PNG ou WebP, com até 10 MB.
          </p>
        </div>
        <Button
          aria-label="Fechar envio de imagem"
          className="-mt-2 -mr-2 size-8 min-h-0 p-0"
          onClick={closeForm}
          size="icon"
          title="Fechar envio de imagem"
          variant="ghost"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-2">
        <span className="text-neutral-500 text-[11px] font-medium tracking-[0.16em] uppercase">
          Arquivo
        </span>
        <input
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          aria-label="Arquivo"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
          }}
          tabIndex={-1}
          type="file"
        />
        <div className="bg-surface-card flex min-h-14 min-w-0 items-center gap-3 rounded-xl border border-border p-2">
          <Button
            className="motion-control shrink-0"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            size="small"
            variant="secondary"
          >
            <Upload aria-hidden="true" />
            Escolher imagem
          </Button>
          <span
            aria-live="polite"
            className="min-w-0 truncate text-sm text-neutral-400"
            title={file?.name}
          >
            {file?.name ?? 'Nenhuma imagem selecionada'}
          </span>
        </div>
      </div>
      <Input
        disabled={isUploading}
        label="Descrição da imagem"
        onChange={(event) => {
          setAltText(event.target.value);
          setError(null);
        }}
        placeholder="Explique o que aparece na imagem"
        required
        value={altText}
      />

      {isUploading ? (
        <div aria-live="polite" className="grid gap-2" role="status">
          <div className="flex items-center justify-between gap-3 text-xs text-neutral-400">
            <span>Enviando imagem…</span>
            <span>{progress === null ? 'Processando' : `${progress}%`}</span>
          </div>
          <div
            aria-label="Progresso do envio"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress ?? undefined}
            className="h-1.5 overflow-hidden rounded-full bg-surface-raised"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: progress === null ? '35%' : `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p aria-live="assertive" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={closeForm} variant="ghost">
          Cancelar
        </Button>
        <Button disabled={isUploading} type="submit">
          {isUploading ? <LoadingSpinner className="size-4" /> : <ImagePlus aria-hidden="true" />}
          {isUploading ? 'Enviando…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
