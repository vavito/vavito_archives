function ArticleSkeleton() {
  return (
    <div className="grid animate-pulse gap-3 border-b border-divider py-5 last:border-b-0">
      <div className="bg-surface-raised h-3 w-40 rounded-full" />
      <div className="bg-surface-raised h-5 w-4/5 rounded-full" />
      <div className="bg-surface-raised h-4 w-full rounded-full" />
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando artigos"
      className="mx-auto grid w-full max-w-3xl gap-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      role="status"
    >
      <div className="grid animate-pulse gap-5">
        <div className="bg-accent-soft h-3 w-56 rounded-full" />
        <div className="bg-surface-raised h-24 w-full max-w-2xl rounded-2xl" />
        <div className="bg-surface-raised h-12 w-full max-w-xl rounded-xl" />
      </div>
      <div className="grid gap-1">
        {Array.from({ length: 4 }, (_, index) => (
          <ArticleSkeleton key={index} />
        ))}
      </div>
      <span className="sr-only">Carregando conteúdo da página inicial…</span>
    </div>
  );
}
