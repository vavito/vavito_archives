import { ArticleEditor } from '@web/features/admin';

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

      <ArticleEditor />
    </article>
  );
}
