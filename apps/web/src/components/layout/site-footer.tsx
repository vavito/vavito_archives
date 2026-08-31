import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-divider">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="grid gap-1">
          <p className="text-neutral-200 text-sm font-medium">vavito archives</p>
          <p className="text-neutral-500 text-xs">
            © 2026 · Artigos sobre tecnologia e construção.
          </p>
        </div>
        <nav aria-label="Links do rodapé" className="flex items-center gap-5">
          <Link
            className="text-neutral-500 hover:text-neutral-200 text-xs transition-colors"
            href="/sobre"
          >
            Sobre
          </Link>
          <Link
            className="text-neutral-500 hover:text-neutral-200 text-xs transition-colors"
            href="/privacidade"
          >
            Privacidade
          </Link>
          <Link
            className="text-neutral-500 hover:text-neutral-200 text-xs transition-colors"
            href="/contato"
          >
            Contato
          </Link>
        </nav>
      </div>
    </footer>
  );
}
