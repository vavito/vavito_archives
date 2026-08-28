export function MonorepoStatus() {
  return (
    <main className="mx-auto grid min-h-screen max-w-3xl content-center gap-4 px-4 py-12 md:px-8">
      <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">Vavito Archives</p>
      <h1 className="text-neutral-100 text-4xl leading-tight font-semibold sm:text-5xl">
        O monorepo está pronto.
      </h1>
      <p className="text-neutral-400 max-w-reading text-base leading-relaxed">
        Esta é a base mínima do frontend. A interface completa será construída nos sprints de UI.
      </p>
      <p className="bg-surface-card text-neutral-300 mt-6 max-w-reading rounded-xl border border-border p-4 text-sm">
        Tailwind CSS e os tokens visuais V2 estão configurados para o tema escuro inicial.
      </p>
    </main>
  );
}
