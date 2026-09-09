import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

export function AdminCommunityLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Carregando administração"
      className="page-state-enter mx-auto grid w-full max-w-6xl gap-6 p-6"
    >
      <p role="status" className="flex items-center gap-2 text-neutral-400">
        <LoadingSpinner /> Carregando…
      </p>
      {[1, 2, 3].map((item) => (
        <div
          aria-hidden="true"
          className="h-40 animate-pulse rounded-2xl bg-surface-card motion-reduce:animate-none"
          key={item}
        />
      ))}
    </main>
  );
}
