'use client';

import { Button, Input } from '@vavito/ui';
import { Check, ImagePlus, Move, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { useRef, useState } from 'react';

import { ProgressiveImage } from '@web/components/feedback/progressive-image';

import { uploadArticleImage } from '../services/admin-media.service';
import type { AdminDraftCover } from '../types/admin-draft.types';
import type { UploadArticleImage } from '../types/admin-media.types';
import { ArticleImageForm } from './article-image-form';

interface ArticleCoverFieldProps {
  altText: string | null;
  disabled?: boolean;
  mediaId?: string | null;
  onChange: (cover: AdminDraftCover | null) => void;
  positionX?: number;
  positionY?: number;
  scale?: number;
  uploadImage?: UploadArticleImage;
  url: string | null;
}

export function ArticleCoverField({
  altText,
  disabled = false,
  mediaId = null,
  onChange,
  positionX = 50,
  positionY = 50,
  scale = 100,
  uploadImage = uploadArticleImage,
  url,
}: Readonly<ArticleCoverFieldProps>) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    positionX: number;
    positionY: number;
    x: number;
    y: number;
  } | null>(null);

  function updateCover(next: Partial<Pick<AdminDraftCover, 'positionX' | 'positionY' | 'scale'>>) {
    if (!mediaId || !url) return;
    onChange({
      altText: altText ?? '',
      mediaId,
      positionX,
      positionY,
      scale,
      url,
      ...next,
    });
  }

  function updateScale(nextScale: number) {
    updateCover({ scale: Math.min(160, Math.max(100, Math.round(nextScale))) });
  }

  function stopDragging(target: HTMLButtonElement, pointerId: number) {
    if (dragRef.current?.pointerId !== pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
  }

  return (
    <section className="bg-surface-card overflow-hidden rounded-2xl border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div className="grid gap-1">
          <h2 className="text-sm font-semibold text-neutral-100">Capa do artigo</h2>
          <p className="text-xs leading-relaxed text-neutral-500">
            Aparece nas listagens, no artigo e nos compartilhamentos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={disabled}
            onClick={() => setIsFormOpen((current) => !current)}
            size="small"
            variant="secondary"
          >
            <ImagePlus aria-hidden="true" />
            {url ? 'Trocar capa' : 'Adicionar capa'}
          </Button>
          {url ? (
            <Button
              disabled={disabled}
              onClick={() => {
                setIsFormOpen(false);
                onChange(null);
              }}
              size="small"
              variant="ghost"
            >
              <Trash2 aria-hidden="true" />
              Remover
            </Button>
          ) : null}
        </div>
      </div>

      {url ? (
        <figure className="grid gap-4 border-divider border-t p-3 sm:p-4">
          <div className="relative overflow-hidden rounded-xl">
            <button
              aria-label={
                isAdjusting
                  ? 'Reposicionar a capa arrastando em qualquer direção'
                  : 'Clique duas vezes para ajustar a capa'
              }
              className={`relative block w-full overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isAdjusting ? `touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}` : 'cursor-zoom-in'}`}
              disabled={disabled}
              onDoubleClick={() => !disabled && setIsAdjusting(true)}
              onKeyDown={(event) => {
                if (!isAdjusting) return;
                const step = event.shiftKey ? 5 : 2;
                if (event.key === 'ArrowLeft')
                  updateCover({ positionX: Math.max(0, positionX - step) });
                if (event.key === 'ArrowRight')
                  updateCover({ positionX: Math.min(100, positionX + step) });
                if (event.key === 'ArrowUp')
                  updateCover({ positionY: Math.max(0, positionY - step) });
                if (event.key === 'ArrowDown')
                  updateCover({ positionY: Math.min(100, positionY + step) });
                if (['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(event.key)) {
                  event.preventDefault();
                }
                if (event.key === '+' || event.key === '=') updateScale(scale + 2);
                if (event.key === '-') updateScale(scale - 2);
                if (event.key === 'Escape') setIsAdjusting(false);
              }}
              onPointerCancel={(event) => stopDragging(event.currentTarget, event.pointerId)}
              onPointerDown={(event) => {
                if (!isAdjusting || disabled) return;
                dragRef.current = {
                  pointerId: event.pointerId,
                  positionX,
                  positionY,
                  x: event.clientX,
                  y: event.clientY,
                };
                setIsDragging(true);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                if (bounds.width <= 0 || bounds.height <= 0) return;
                updateCover({
                  positionX: Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round(drag.positionX - ((event.clientX - drag.x) / bounds.width) * 100),
                    ),
                  ),
                  positionY: Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round(drag.positionY - ((event.clientY - drag.y) / bounds.height) * 100),
                    ),
                  ),
                });
              }}
              onPointerUp={(event) => stopDragging(event.currentTarget, event.pointerId)}
              onWheel={(event) => {
                if (!isAdjusting) return;
                event.preventDefault();
                updateScale(scale + (event.deltaY < 0 ? 2 : -2));
              }}
              type="button"
            >
              <ProgressiveImage
                alt={altText ?? 'Capa do artigo'}
                className="motion-media select-none object-cover"
                containerClassName="aspect-[16/9] max-h-[26rem] w-full"
                draggable={false}
                fill
                loadingLabel="Carregando capa do artigo"
                quality={80}
                sizes="(max-width: 1024px) calc(100vw - 2rem), 960px"
                src={url}
                style={{
                  objectPosition: `${positionX}% ${positionY}%`,
                  transform: `scale(${scale / 100})`,
                  transformOrigin: `${positionX}% ${positionY}%`,
                }}
                unoptimized={url.startsWith('blob:')}
              />
            </button>
            <div
              className={`absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-full bg-background/85 px-3 py-2 text-xs text-neutral-200 backdrop-blur transition-opacity ${isAdjusting ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            >
              <span className="flex items-center gap-2">
                <Move aria-hidden="true" className="size-4" />
                Arraste para enquadrar
              </span>
              <span className="flex items-center gap-1">
                <Button
                  aria-label="Diminuir zoom da capa"
                  disabled={scale <= 100}
                  onClick={() => updateScale(scale - 5)}
                  size="icon"
                  variant="ghost"
                >
                  <ZoomOut aria-hidden="true" />
                </Button>
                <span className="min-w-10 text-center font-mono">{scale}%</span>
                <Button
                  aria-label="Aumentar zoom da capa"
                  disabled={scale >= 160}
                  onClick={() => updateScale(scale + 5)}
                  size="icon"
                  variant="ghost"
                >
                  <ZoomIn aria-hidden="true" />
                </Button>
              </span>
            </div>
          </div>
          <Input
            disabled={disabled}
            label="Descrição da capa"
            maxLength={180}
            onChange={(event) =>
              mediaId &&
              onChange({ altText: event.target.value, mediaId, positionX, positionY, scale, url })
            }
            value={altText ?? ''}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
            <p>
              {isAdjusting
                ? 'Arraste para reposicionar e use os controles, a roda ou +/− para ajustar o zoom.'
                : 'Clique duas vezes na capa para ajustar o zoom e o enquadramento.'}
            </p>
            {isAdjusting ? (
              <Button onClick={() => setIsAdjusting(false)} size="small" variant="secondary">
                <Check aria-hidden="true" />
                Concluir ajuste
              </Button>
            ) : null}
          </div>
        </figure>
      ) : null}

      {isFormOpen && !disabled ? (
        <ArticleImageForm
          ariaLabel="Selecionar capa do artigo"
          onClose={() => setIsFormOpen(false)}
          onUploaded={(image) => {
            onChange({
              altText: image.altText,
              mediaId: image.id,
              positionX: 50,
              positionY: 50,
              scale: 100,
              url: image.url,
            });
            setIsFormOpen(false);
          }}
          submitLabel="Usar como capa"
          title="Selecionar capa do artigo"
          uploadImage={uploadImage}
        />
      ) : null}
    </section>
  );
}
