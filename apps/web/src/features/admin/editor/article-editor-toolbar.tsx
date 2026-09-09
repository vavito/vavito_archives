'use client';

import { Button, cn } from '@vavito/ui';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import {
  Bold,
  Code2,
  FileCode2,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  Quote,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

type EditorTool =
  'bold' | 'code' | 'codeBlock' | 'heading2' | 'heading3' | 'image' | 'italic' | 'link' | 'quote';

interface ArticleEditorToolbarProps {
  editor: Editor;
  onAddImage: () => void;
  onEditLink: () => void;
}

interface ToolbarButtonsProps extends ArticleEditorToolbarProps {
  label: string;
  tools: readonly EditorTool[];
}

interface ToolbarAction {
  active: boolean;
  ariaKeyShortcuts?: string;
  icon: LucideIcon;
  label: string;
  run: () => void;
  shortcut: string;
}

const bubbleMenuOptions = { offset: 8, placement: 'top' as const };
const floatingMenuOptions = { offset: 8, placement: 'bottom-start' as const };
const appendMenuToBody = () => document.body;

function ToolbarButtons({
  editor,
  label,
  onAddImage,
  onEditLink,
  tools,
}: Readonly<ToolbarButtonsProps>) {
  const activeFormats = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor.isActive('bold'),
      code: currentEditor.isActive('code'),
      codeBlock: currentEditor.isActive('codeBlock'),
      heading2: currentEditor.isActive('heading', { level: 2 }),
      heading3: currentEditor.isActive('heading', { level: 3 }),
      image: currentEditor.isActive('image'),
      italic: currentEditor.isActive('italic'),
      link: currentEditor.isActive('link'),
      quote: currentEditor.isActive('blockquote'),
    }),
  });

  const actions: Record<EditorTool, ToolbarAction> = {
    bold: {
      active: activeFormats.bold,
      ariaKeyShortcuts: 'Control+B Meta+B',
      icon: Bold,
      label: 'Negrito',
      run: () => editor.chain().focus().toggleBold().run(),
      shortcut: 'Ctrl/⌘ + B',
    },
    code: {
      active: activeFormats.code,
      ariaKeyShortcuts: 'Control+E Meta+E',
      icon: Code2,
      label: 'Código em linha',
      run: () => editor.chain().focus().toggleCode().run(),
      shortcut: 'Ctrl/⌘ + E',
    },
    codeBlock: {
      active: activeFormats.codeBlock,
      ariaKeyShortcuts: 'Control+Alt+C Meta+Alt+C',
      icon: FileCode2,
      label: 'Bloco de código',
      run: () => editor.chain().focus().toggleCodeBlock().run(),
      shortcut: 'Ctrl/⌘ + Alt + C',
    },
    heading2: {
      active: activeFormats.heading2,
      ariaKeyShortcuts: 'Control+Alt+2 Meta+Alt+2',
      icon: Heading2,
      label: 'Título de seção',
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      shortcut: 'Ctrl/⌘ + Alt + 2',
    },
    heading3: {
      active: activeFormats.heading3,
      ariaKeyShortcuts: 'Control+Alt+3 Meta+Alt+3',
      icon: Heading3,
      label: 'Subtítulo de seção',
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      shortcut: 'Ctrl/⌘ + Alt + 3',
    },
    image: {
      active: activeFormats.image,
      icon: ImagePlus,
      label: 'Inserir imagem',
      run: onAddImage,
      shortcut: 'Abrir envio',
    },
    italic: {
      active: activeFormats.italic,
      ariaKeyShortcuts: 'Control+I Meta+I',
      icon: Italic,
      label: 'Itálico',
      run: () => editor.chain().focus().toggleItalic().run(),
      shortcut: 'Ctrl/⌘ + I',
    },
    link: {
      active: activeFormats.link,
      ariaKeyShortcuts: 'Control+K Meta+K',
      icon: Link2,
      label: 'Adicionar ou editar link',
      run: onEditLink,
      shortcut: 'Ctrl/⌘ + K',
    },
    quote: {
      active: activeFormats.quote,
      ariaKeyShortcuts: 'Control+Shift+B Meta+Shift+B',
      icon: Quote,
      label: 'Citação',
      run: () => editor.chain().focus().toggleBlockquote().run(),
      shortcut: 'Ctrl/⌘ + Shift + B',
    },
  };

  return (
    <div aria-label={label} className="flex flex-wrap items-center gap-1" role="toolbar">
      {tools.map((tool) => {
        const action = actions[tool];
        const Icon = action.icon;

        return (
          <Button
            key={tool}
            aria-keyshortcuts={action.ariaKeyShortcuts}
            aria-label={action.label}
            aria-pressed={action.active}
            className={cn(
              'size-9 min-h-0 px-0 py-0',
              action.active && 'border-accent/50 bg-accent/15 text-accent',
            )}
            onClick={action.run}
            onMouseDown={(event) => event.preventDefault()}
            size="icon"
            title={action.ariaKeyShortcuts ? `${action.label} (${action.shortcut})` : action.label}
            variant="ghost"
          >
            <Icon aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}

export function ArticleEditorToolbar({
  editor,
  onAddImage,
  onEditLink,
}: Readonly<ArticleEditorToolbarProps>) {
  return (
    <ToolbarButtons
      editor={editor}
      label="Ferramentas de formatação"
      onAddImage={onAddImage}
      onEditLink={onEditLink}
      tools={[
        'heading2',
        'heading3',
        'bold',
        'italic',
        'link',
        'image',
        'code',
        'codeBlock',
        'quote',
      ]}
    />
  );
}

export function ArticleEditorContextMenus({
  editor,
  onAddImage,
  onEditLink,
}: Readonly<ArticleEditorToolbarProps>) {
  const [isEditingImage, setIsEditingImage] = useState(false);
  const imageAttributes = editor.getAttributes('image') as {
    alt?: string;
    width?: number | string;
  };

  return (
    <>
      <BubbleMenu
        appendTo={appendMenuToBody}
        className="article-editor-context-menu"
        editor={editor}
        options={bubbleMenuOptions}
        shouldShow={({ editor: currentEditor, from, to }) =>
          from !== to && !currentEditor.isActive('image')
        }
      >
        <ToolbarButtons
          editor={editor}
          label="Formatação da seleção"
          onAddImage={onAddImage}
          onEditLink={onEditLink}
          tools={['bold', 'italic', 'link', 'code']}
        />
      </BubbleMenu>

      <FloatingMenu
        appendTo={appendMenuToBody}
        className="article-editor-context-menu"
        editor={editor}
        options={floatingMenuOptions}
      >
        <ToolbarButtons
          editor={editor}
          label="Inserir bloco"
          onAddImage={onAddImage}
          onEditLink={onEditLink}
          tools={['heading2', 'heading3', 'quote', 'codeBlock']}
        />
      </FloatingMenu>

      <BubbleMenu
        appendTo={appendMenuToBody}
        className="article-editor-context-menu"
        editor={editor}
        options={bubbleMenuOptions}
        shouldShow={({ editor: currentEditor }) => currentEditor.isActive('image')}
      >
        <div className="flex flex-wrap items-center gap-1">
          {[50, 75, 100].map((width) => (
            <Button
              aria-label={`Usar ${width}% da largura`}
              key={width}
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .updateAttributes('image', { height: null, width: `${width}%` })
                  .run()
              }
              size="small"
              variant={String(imageAttributes.width) === `${width}%` ? 'secondary' : 'ghost'}
            >
              {width}%
            </Button>
          ))}
          <Button
            onClick={() => setIsEditingImage((current) => !current)}
            size="small"
            variant="ghost"
          >
            Editar descrição
          </Button>
          <Button
            aria-label="Remover imagem"
            className="text-destructive hover:text-destructive"
            onClick={() => editor.chain().focus().deleteSelection().run()}
            size="small"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" />
            Remover imagem
          </Button>
          {isEditingImage ? (
            <form
              className="basis-full grid gap-2 border-t border-divider pt-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const alt = data.get('alt');
                editor
                  .chain()
                  .focus()
                  .updateAttributes('image', { alt: typeof alt === 'string' ? alt.trim() : '' })
                  .run();
                setIsEditingImage(false);
              }}
            >
              <label className="text-xs text-neutral-400" htmlFor="selected-image-alt">
                Descrição da imagem
              </label>
              <input
                className="rounded-lg border border-border bg-surface-card px-3 py-2 text-sm text-neutral-100 outline-none focus:border-accent"
                defaultValue={imageAttributes.alt ?? ''}
                id="selected-image-alt"
                name="alt"
                required
              />
              <Button size="small" type="submit">
                Aplicar
              </Button>
            </form>
          ) : null}
        </div>
      </BubbleMenu>
    </>
  );
}
