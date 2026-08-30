function ArticleSkeleton() {
  return (
    <div className="grid animate-pulse gap-3 border-b border-divider py-5 last:border-b-0">
      <div className="bg-surface-raised h-3 w-44 rounded-full" />
      <div className="bg-surface-raised h-5 w-4/5 rounded-full" />
      <div className="bg-surface-raised h-4 w-full rounded-full" />
      <div className="bg-surface-raised h-3 w-32 rounded-full" />
    </div>
  );
}

export function ArticlesPageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando listagem de artigos"
      className="mx-auto grid w-full max-w-3xl gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      role="status"
    >
      <div className="grid animate-pulse gap-4">
        <div className="bg-accent-soft h-3 w-36 rounded-full" />
        <div className="bg-surface-raised h-10 w-48 rounded-xl" />
        <div className="bg-surface-raised h-12 w-full max-w-xl rounded-xl" />
      </div>
      <div className="flex animate-pulse gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="bg-surface-raised h-8 w-24 rounded-full" key={index} />
        ))}
      </div>
      <div className="grid gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <ArticleSkeleton key={index} />
        ))}
      </div>
      <span className="sr-only">Carregando os artigos publicados…</span>
    </div>
  );
}
