'use client';

import { Button, Input } from '@vavito/ui';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ArticleTagsFieldProps {
  disabled?: boolean;
  onChange: (tagNames: string[]) => void;
  tagNames: string[];
}

function normalizeTagNames(value: string): string[] {
  return [
    ...new Map(
      value
        .split(',')
        .map((name) => name.normalize('NFC').trim().replace(/^#+/u, '').replaceAll(/\s+/g, ' '))
        .filter(Boolean)
        .map((name) => [name.toLocaleLowerCase('pt-BR'), name]),
    ).values(),
  ];
}

export function ArticleTagsField({
  disabled = false,
  onChange,
  tagNames,
}: Readonly<ArticleTagsFieldProps>) {
  const [value, setValue] = useState('');

  function addTags(values: string[]) {
    const normalized = normalizeTagNames([...tagNames, ...values].join(','));
    if (normalized.length > tagNames.length) onChange(normalized);
  }

  function commitValue() {
    if (!value.trim()) return;
    addTags([value]);
    setValue('');
  }

  return (
    <div className="grid gap-2">
      <Input
        autoComplete="off"
        disabled={disabled}
        label="Tópicos do artigo"
        maxLength={600}
        onBlur={commitValue}
        onChange={(event) => {
          const parts = event.target.value.split(',');
          if (parts.length === 1) {
            setValue(event.target.value);
            return;
          }
          addTags(parts.slice(0, -1));
          setValue(parts.at(-1) ?? '');
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitValue();
          }
          if (event.key === 'Backspace' && !value && tagNames.length > 0) {
            onChange(tagNames.slice(0, -1));
          }
        }}
        placeholder="Digite um tópico e pressione Enter"
        value={value}
      />
      <p className="text-xs leading-relaxed text-neutral-400">
        Confirme com vírgula ou Enter. Os tópicos aparecerão como hashtags e poderão filtrar os
        artigos.
      </p>
      {tagNames.length > 0 ? (
        <ul aria-label="Tópicos adicionados" className="flex flex-wrap gap-2">
          {tagNames.map((name) => (
            <li
              className="flex items-center gap-1 rounded-full border border-border bg-surface-card py-1 pr-1 pl-2.5 font-mono text-xs text-accent"
              key={name.toLocaleLowerCase('pt-BR')}
            >
              <span>#{name}</span>
              <Button
                aria-label={`Remover tópico ${name}`}
                className="min-h-0 size-6 p-0"
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onChange(tagNames.filter((tag) => tag !== name))}
                size="icon"
                title={`Remover tópico ${name}`}
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
