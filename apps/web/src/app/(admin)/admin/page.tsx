import { Bold, Code2, Italic, Link2, Quote } from 'lucide-react';

const editorTools = [
  { icon: Bold, label: 'Negrito' },
  { icon: Italic, label: 'Itálico' },
  { icon: Link2, label: 'Adicionar link' },
  { icon: Quote, label: 'Citação' },
  { icon: Code2, label: 'Código' },
] as const;

export default function AdminPage() {
  return (
    <article className="relative flex flex-1 flex-col gap-8">
      <header className="grid gap-4">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">Editor</p>
        <label className="sr-only" htmlFor="article-title">
          Título do artigo
        </label>
        <textarea
          className="placeholder:text-neutral-600 min-h-24 w-full resize-none bg-transparent text-4xl leading-tight font-semibold text-neutral-100 outline-none sm:text-5xl"
          id="article-title"
          placeholder="Título do artigo"
          rows={2}
        />
      </header>

      <div
        aria-label="Ferramentas de formatação"
        className="bg-floating sticky top-20 z-30 mx-auto flex items-center gap-1 rounded-full border border-border p-1.5 shadow-2xl"
        role="toolbar"
      >
        {editorTools.map(({ icon: Icon, label }) => (
          <button
            key={label}
            aria-label={label}
            className="text-neutral-400 hover:bg-surface-raised hover:text-neutral-100 grid size-9 place-items-center rounded-full transition-colors"
            type="button"
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        ))}
      </div>

      <section aria-label="Conteúdo do artigo" className="grid flex-1 gap-5 pb-24">
        <p className="text-neutral-300 text-lg leading-8">
          Comece a escrever seu artigo. Este espaço representa o canvas do editor que será
          implementado nas próximas tasks.
        </p>
        <p className="text-neutral-500 text-base leading-8">
          O layout administrativo mantém o foco na escrita e, por isso, não exibe o cabeçalho, o
          rodapé ou a navegação móvel do site público.
        </p>
      </section>
    </article>
  );
}
