'use client';

import { Button, cn } from '@vavito/ui';
import { Eye, EyeOff } from 'lucide-react';
import { useState, useTransition } from 'react';

import { updateAdminTagVisibilityAction } from '../actions/admin-tag.actions';
import type { AdminTag } from '../services/admin-tags.service';

export function AdminTopicsManager({ initialTags }: Readonly<{ initialTags: AdminTag[] }>) {
  const [tags, setTags] = useState(initialTags);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(tag: AdminTag) {
    if (isPending) return;
    setError(null);
    const nextVisibility = !tag.isPublic;
    startTransition(async () => {
      const result = await updateAdminTagVisibilityAction(tag.id, nextVisibility);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setTags((current) =>
        current.map((item) => (item.id === tag.id ? { ...item, isPublic: nextVisibility } : item)),
      );
    });
  }

  return (
    <section aria-labelledby="admin-topics-title" className="grid gap-4">
      <div>
        <h2 className="text-neutral-100 text-xl font-semibold" id="admin-topics-title">
          Tópicos públicos
        </h2>
        <p className="text-neutral-400 mt-1 max-w-2xl text-sm">
          Escolha quais tópicos aparecem nos filtros da Home e de Artigos. Os tópicos e suas
          relações permanecem salvos mesmo quando ficam ocultos ou sem artigos publicados.
        </p>
      </div>
      {error ? (
        <p className="text-red-300 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {tags.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <li
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-card p-4"
              key={tag.id}
            >
              <div className="min-w-0">
                <p className="text-neutral-100 truncate font-medium">#{tag.slug}</p>
                <p className="text-neutral-500 mt-1 text-xs">
                  {tag.publishedPostCount === 1
                    ? '1 artigo publicado'
                    : `${tag.publishedPostCount} artigos publicados`}
                </p>
              </div>
              <Button
                aria-label={`${tag.isPublic ? 'Ocultar' : 'Mostrar'} tópico ${tag.name}`}
                className={cn('shrink-0')}
                disabled={isPending}
                onClick={() => toggle(tag)}
                size="icon"
                title={tag.isPublic ? 'Ocultar tópico' : 'Mostrar tópico'}
                variant={tag.isPublic ? 'secondary' : 'ghost'}
              >
                {tag.isPublic ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                <span className="sr-only">{tag.isPublic ? 'Visível' : 'Oculto'}</span>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-neutral-400 rounded-xl border border-dashed border-border p-6 text-sm">
          Nenhum tópico foi criado por artigos ainda.
        </p>
      )}
    </section>
  );
}
