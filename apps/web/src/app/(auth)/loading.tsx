import { LoadingSpinner } from '@web/components/feedback/loading-spinner';

export default function AuthLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Preparando acesso"
      className="auth-panel-enter auth-panel-surface bg-surface-card flex min-h-32 w-full max-w-md items-center justify-center gap-3 rounded-3xl border border-border p-8 text-sm text-neutral-400"
      role="status"
    >
      <LoadingSpinner className="text-accent size-5" />
      <span className="auth-feedback-enter">Preparando seu acesso…</span>
    </div>
  );
}
