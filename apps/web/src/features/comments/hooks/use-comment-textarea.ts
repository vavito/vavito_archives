'use client';

import { useLayoutEffect, useRef } from 'react';

const AUTO_GROW_CHARACTERS = 1000;

export function useCommentTextarea(content: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;

    function resize() {
      if (!textarea) return;
      const style = getComputedStyle(textarea);
      const mirror = document.createElement('textarea');
      mirror.tabIndex = -1;
      mirror.setAttribute('aria-hidden', 'true');
      Object.assign(mirror.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        height: '0',
        minHeight: '0',
        width: style.width,
        boxSizing: style.boxSizing,
        padding: style.padding,
        border: style.border,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontStyle: style.fontStyle,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        visibility: 'hidden',
      });
      // Measure only the growth budget; longer comments scroll inside the same field.
      mirror.value = content.slice(0, AUTO_GROW_CHARACTERS);
      document.body.append(mirror);
      const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
      const measuredHeight = mirror.scrollHeight + border;
      textarea.style.height = `${Math.max(112, Math.min(640, measuredHeight))}px`;
      textarea.style.overflowY =
        content.length > AUTO_GROW_CHARACTERS || measuredHeight > 640 ? 'auto' : 'hidden';
      mirror.remove();
    }

    resize();
    let previousWidth = textarea.offsetWidth;
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            const width = textarea.offsetWidth;
            if (width !== previousWidth) {
              previousWidth = width;
              resize();
            }
          });
    observer?.observe(textarea);
    return () => observer?.disconnect();
  }, [content]);

  return ref;
}
