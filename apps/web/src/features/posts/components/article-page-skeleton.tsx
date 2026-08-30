export function ArticlePageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando artigo"
      className="mx-auto grid w-full max-w-3xl animate-pulse gap-8 px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      role="status"
    >
      <div className="bg-accent-soft h-3 w-40 rounded-full" />
      <div className="bg-surface-raised h-24 w-full rounded-2xl" />
      <div className="bg-surface-raised h-14 w-full rounded-xl" />
      <div className="bg-surface-raised aspect-[16/9] w-full rounded-2xl" />
      <div className="mx-auto grid w-full max-w-reading gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            className="bg-surface-raised h-4 rounded-full"
            key={index}
            style={{ width: index % 3 === 2 ? '76%' : '100%' }}
          />
        ))}
      </div>
      <span className="sr-only">Carregando conteúdo do artigo…</span>
    </div>
  );
}
