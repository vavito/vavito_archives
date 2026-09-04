'use client';

import { Button } from '@vavito/ui';
import { useState } from 'react';

export const COLLAPSED_COMMENT_LENGTH = 400;

interface ExpandableCommentContentProps {
  content: string;
}

function collapsedContent(content: string): string {
  const candidate = content.slice(0, COLLAPSED_COMMENT_LENGTH + 1);
  const lastWhitespace = Math.max(candidate.lastIndexOf(' '), candidate.lastIndexOf('\n'));
  const end =
    lastWhitespace >= COLLAPSED_COMMENT_LENGTH * 0.8 ? lastWhitespace : COLLAPSED_COMMENT_LENGTH;

  return content.slice(0, end).trimEnd();
}

export function ExpandableCommentContent({ content }: Readonly<ExpandableCommentContentProps>) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > COLLAPSED_COMMENT_LENGTH;
  const visibleContent = isLong && !expanded ? `${collapsedContent(content)}…` : content;

  return (
    <div className="mt-2 grid justify-items-start gap-1">
      <p className="text-neutral-300 min-w-0 max-w-full whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">
        {visibleContent}
      </p>
      {isLong ? (
        <Button
          aria-expanded={expanded}
          className="h-auto min-h-0 px-0 py-1"
          onClick={() => setExpanded((current) => !current)}
          size="small"
          variant="ghost"
        >
          {expanded ? 'Mostrar menos' : 'Ler mais'}
        </Button>
      ) : null}
    </div>
  );
}
