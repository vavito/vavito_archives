import { buttonVariants, cn } from '@vavito/ui';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import Link from 'next/link';

export function EmailConfirmed() {
  return (
    <section
      aria-labelledby="email-confirmed-title"
      className="auth-panel-enter auth-panel-surface bg-surface-card grid w-full max-w-md justify-items-center gap-6 rounded-3xl border border-border p-6 text-center sm:p-8"
    >
      <span className="bg-accent/10 grid size-16 place-items-center rounded-full text-accent">
        <BadgeCheck aria-hidden="true" className="size-8" />
      </span>

      <header className="auth-sequence grid gap-3">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">Tudo certo</p>
        <h1 className="text-2xl font-semibold text-neutral-100" id="email-confirmed-title">
          E-mail confirmado com sucesso!
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Sua conta já foi criada e está pronta. Você já pode começar a acessar o Vavito Archives.
        </p>
      </header>

      <Link className={cn(buttonVariants({ size: 'large' }), 'w-full')} href="/perfil">
        Acessar minha conta
        <ArrowRight aria-hidden="true" />
      </Link>
    </section>
  );
}
