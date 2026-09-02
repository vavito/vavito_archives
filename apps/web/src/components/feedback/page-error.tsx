'use client';

import { Button } from '@vavito/ui';
import { RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const RETRY_FEEDBACK_DURATION_MS = 2_000;

export interface RouteErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

interface PageErrorProps {
  description?: string;
  retry?: () => void;
  title?: string;
}

export function PageError({
  description = 'Não conseguimos carregar esta página agora. Tente novamente em alguns instantes.',
  retry,
  title = 'Não foi possível carregar o conteúdo.',
}: Readonly<PageErrorProps>) {
  const [isRetrying, setIsRetrying] = useState(false);
  const retryInProgress = useRef(false);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    },
    [],
  );

  function handleRetry() {
    if (retryInProgress.current) {
      return;
    }

    retryInProgress.current = true;
    setIsRetrying(true);
    retryTimeout.current = setTimeout(() => {
      retryTimeout.current = null;
      retryInProgress.current = false;
      if (retry) {
        retry();
      } else {
        window.location.reload();
      }
      setIsRetrying(false);
    }, RETRY_FEEDBACK_DURATION_MS);
  }

  return (
    <div className="mx-auto grid min-h-[55vh] w-full max-w-3xl place-items-center px-4 py-16 sm:px-6">
      <section
        aria-labelledby="page-error-title"
        className="page-state-enter grid max-w-md gap-4 text-center"
      >
        <p className="text-accent font-mono text-xs tracking-eyebrow uppercase">Algo deu errado</p>
        <h1 className="text-neutral-100 text-2xl font-semibold" id="page-error-title">
          {title}
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
        <div>
          <Button
            disabled={isRetrying}
            onClick={handleRetry}
            onPointerUp={(event) => {
              if (event.pointerType === 'touch') {
                handleRetry();
              }
            }}
          >
            <RotateCcw
              aria-hidden="true"
              className={isRetrying ? 'counterclockwise-spinner' : undefined}
            />
            <span aria-live="polite">
              {isRetrying ? 'Tentando novamente…' : 'Tentar novamente'}
            </span>
          </Button>
        </div>
      </section>
    </div>
  );
}
