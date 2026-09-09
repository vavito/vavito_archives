'use client';

import { Button } from '@vavito/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { PostSummary } from '../types/posts.types';
import { ArticleCard } from './article-card';

const DESKTOP_CARD_GAP_PX = 32;

export function RelatedPostsList({ posts }: Readonly<{ posts: PostSummary[] }>) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const draggedRef = useRef(false);
  const [canRetreat, setCanRetreat] = useState(false);
  const [canAdvance, setCanAdvance] = useState(posts.length > 2);

  const updateNavigation = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    setCanRetreat(list.scrollLeft > 2);
    setCanAdvance(list.scrollLeft + list.clientWidth < list.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    updateNavigation();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateNavigation);
    observer.observe(list);
    return () => observer.disconnect();
  }, [posts.length, updateNavigation]);

  function moveOneArticle(direction: -1 | 1) {
    const list = listRef.current;
    const card = list?.firstElementChild;
    if (!list || !(card instanceof HTMLElement)) return;
    list.scrollBy({
      behavior: 'smooth',
      left: direction * (card.offsetWidth + DESKTOP_CARD_GAP_PX),
    });
  }

  function startDragging(event: React.PointerEvent<HTMLDivElement>) {
    if (posts.length <= 2 || event.pointerType === 'touch') return;
    const list = listRef.current;
    if (!list) return;
    draggedRef.current = false;
    const startX = event.clientX;
    const startScroll = list.scrollLeft;
    list.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent) => {
      draggedRef.current ||= Math.abs(moveEvent.clientX - startX) > 5;
      list.scrollLeft = startScroll - (moveEvent.clientX - startX);
    };
    const stop = () => {
      list.removeEventListener('pointermove', move);
      list.removeEventListener('pointerup', stop);
      list.removeEventListener('pointercancel', stop);
      updateNavigation();
    };
    list.addEventListener('pointermove', move);
    list.addEventListener('pointerup', stop);
    list.addEventListener('pointercancel', stop);
  }

  return (
    <div className="relative min-w-0">
      <div
        className={
          posts.length > 2
            ? 'grid min-w-0 divide-y divide-divider lg:auto-cols-[calc(50%-1rem)] lg:grid-flow-col lg:grid-cols-none lg:gap-x-8 lg:divide-y-0 lg:overflow-x-auto lg:overscroll-x-contain lg:scroll-smooth lg:snap-x lg:snap-mandatory lg:cursor-grab lg:select-none lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden'
            : 'grid min-w-0 divide-y divide-divider lg:grid-cols-2 lg:gap-x-8 lg:divide-y-0'
        }
        onClickCapture={(event) => {
          if (!draggedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          draggedRef.current = false;
        }}
        onPointerDown={startDragging}
        onScroll={updateNavigation}
        ref={listRef}
      >
        {posts.map((post) => (
          <div className="min-w-0 lg:snap-start" key={post.id}>
            <ArticleCard compact post={post} />
          </div>
        ))}
      </div>

      {posts.length > 2 && canRetreat ? (
        <Button
          aria-label="Ver artigo relacionado anterior"
          className="absolute top-[36%] left-2 z-10 hidden -translate-y-1/2 rounded-full border border-accent/70 bg-accent text-background shadow-[0_10px_30px_rgba(119,211,255,0.28)] hover:bg-accent/85 lg:grid"
          onClick={() => moveOneArticle(-1)}
          size="icon"
          title="Ver artigo anterior"
          variant="primary"
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
      ) : null}

      {posts.length > 2 && canAdvance ? (
        <Button
          aria-label="Ver próximo artigo relacionado"
          className="absolute top-[36%] right-2 z-10 hidden -translate-y-1/2 rounded-full border border-accent/70 bg-accent text-background shadow-[0_10px_30px_rgba(119,211,255,0.28)] hover:bg-accent/85 lg:grid"
          onClick={() => moveOneArticle(1)}
          size="icon"
          title="Ver próximo artigo"
          variant="primary"
        >
          <ArrowRight aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
