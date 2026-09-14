import { Fragment, type ReactNode } from 'react';

import { ProgressiveImage } from '@web/components/feedback/progressive-image';

import type { TiptapMark, TiptapNode } from '../types/posts.types';

interface TiptapContentProps {
  content: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readDocument(content: Record<string, unknown>): TiptapNode[] {
  if (content['type'] !== 'doc' || !Array.isArray(content['content'])) {
    return [];
  }

  return content['content'].filter(
    (node): node is TiptapNode => isRecord(node) && typeof node['type'] === 'string',
  );
}

function attributeString(attrs: Record<string, unknown> | undefined, key: string): string | null {
  const value = attrs?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function attributeDimension(
  attrs: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const value = attrs?.[key];
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

function safeUrl(value: string | null, protocols: readonly string[]): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }

  try {
    const url = new URL(value);
    return protocols.includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function renderMark(content: ReactNode, mark: TiptapMark, key: number): ReactNode {
  switch (mark.type) {
    case 'bold':
      return <strong key={key}>{content}</strong>;
    case 'code':
      return <code key={key}>{content}</code>;
    case 'italic':
      return <em key={key}>{content}</em>;
    case 'link': {
      const href = safeUrl(attributeString(mark.attrs, 'href'), ['http:', 'https:', 'mailto:']);
      return href ? (
        <a href={href} key={key} rel="noreferrer noopener" target="_blank">
          {content}
        </a>
      ) : (
        content
      );
    }
    case 'strike':
      return <s key={key}>{content}</s>;
    case 'underline':
      return <u key={key}>{content}</u>;
    default:
      return content;
  }
}

function renderChildren(node: TiptapNode, keyPrefix: string): ReactNode {
  return node.content?.map((child, index) => renderNode(child, `${keyPrefix}-${index}`)) ?? null;
}

function renderText(node: TiptapNode): ReactNode {
  return (node.marks ?? []).reduce<ReactNode>(
    (content, mark, index) => renderMark(content, mark, index),
    node.text ?? '',
  );
}

function renderNode(node: TiptapNode, key: string): ReactNode {
  const children = renderChildren(node, key);

  switch (node.type) {
    case 'blockquote':
      return <blockquote key={key}>{children}</blockquote>;
    case 'bulletList':
      return <ul key={key}>{children}</ul>;
    case 'codeBlock': {
      const language = attributeString(node.attrs, 'language');
      return (
        <pre data-language={language ?? undefined} key={key}>
          <code>{children}</code>
        </pre>
      );
    }
    case 'hardBreak':
      return <br key={key} />;
    case 'heading': {
      const requestedLevel = node.attrs?.['level'];
      const level =
        typeof requestedLevel === 'number' && requestedLevel >= 2 && requestedLevel <= 4
          ? requestedLevel
          : 2;

      if (level === 3) {
        return <h3 key={key}>{children}</h3>;
      }

      if (level === 4) {
        return <h4 key={key}>{children}</h4>;
      }

      return <h2 key={key}>{children}</h2>;
    }
    case 'horizontalRule':
      return <hr key={key} />;
    case 'image': {
      const src = safeUrl(attributeString(node.attrs, 'src'), ['http:', 'https:']);

      if (!src) {
        return null;
      }

      const alt = attributeString(node.attrs, 'alt') ?? '';
      const title = attributeString(node.attrs, 'title') ?? undefined;
      const width = attributeDimension(node.attrs, 'width') ?? 1200;
      const height = attributeDimension(node.attrs, 'height') ?? 675;

      return (
        <figure key={key}>
          <ProgressiveImage
            alt={alt}
            className="h-auto w-full rounded-2xl"
            containerClassName="w-full rounded-2xl"
            height={height}
            loading="lazy"
            loadingLabel={alt ? `Carregando ${alt}` : 'Carregando imagem do artigo'}
            quality={80}
            sizes="(max-width: 768px) calc(100vw - 2rem), 768px"
            src={src}
            title={title}
            width={width}
          />
          {title ? <figcaption>{title}</figcaption> : null}
        </figure>
      );
    }
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'orderedList': {
      const start = node.attrs?.['start'];
      return (
        <ol key={key} start={typeof start === 'number' ? start : undefined}>
          {children}
        </ol>
      );
    }
    case 'paragraph':
      return <p key={key}>{children}</p>;
    case 'text':
      return <Fragment key={key}>{renderText(node)}</Fragment>;
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
}

export function TiptapContent({ content }: Readonly<TiptapContentProps>) {
  const nodes = readDocument(content);

  if (nodes.length === 0) {
    return <p>Este artigo ainda não possui conteúdo disponível.</p>;
  }

  return <>{nodes.map((node, index) => renderNode(node, `node-${index}`))}</>;
}
