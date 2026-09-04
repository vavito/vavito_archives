interface PageLoadingProps {
  label?: string;
}

export function PageLoading({ label = 'Carregando conteúdo' }: Readonly<PageLoadingProps>) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="page-state-enter mx-auto grid w-full max-w-3xl animate-pulse gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-20"
      role="status"
    >
      <div className="grid gap-4">
        <div className="bg-accent-soft h-3 w-40 rounded-full" />
        <div className="bg-surface-raised h-12 w-3/4 rounded-xl" />
        <div className="bg-surface-raised h-5 w-full rounded-full" />
      </div>
      <div className="grid gap-5">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="grid gap-3" key={index}>
            <div className="bg-surface-raised h-4 w-full rounded-full" />
            <div className="bg-surface-raised h-4 w-5/6 rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">{label}…</span>
    </div>
  );
}
