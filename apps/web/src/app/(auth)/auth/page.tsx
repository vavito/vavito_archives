import { Button, Input } from '@vavito/ui';
import { LockKeyhole, Mail } from 'lucide-react';

export default function AuthPage() {
  return (
    <section
      aria-labelledby="auth-title"
      className="bg-surface-card grid w-full max-w-md gap-7 rounded-3xl border border-border p-5 sm:p-8"
    >
      <header className="grid gap-2 text-center">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">Sua conta</p>
        <h1 className="text-2xl font-semibold text-neutral-100" id="auth-title">
          Continue no Vavito Archives
        </h1>
        <p className="text-neutral-400 text-sm leading-relaxed">
          Entre para comentar, reagir e salvar seus artigos favoritos.
        </p>
      </header>

      <div
        aria-label="Escolher fluxo de autenticação"
        className="bg-surface-raised grid grid-cols-2 rounded-xl p-1"
      >
        <button
          aria-pressed="true"
          className="bg-floating min-h-10 rounded-lg text-sm font-medium text-neutral-100 shadow-sm"
          type="button"
        >
          Entrar
        </button>
        <button className="text-neutral-400 min-h-10 rounded-lg text-sm" type="button">
          Criar conta
        </button>
      </div>

      <form className="grid gap-5">
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="text-neutral-500 absolute top-10 left-4 z-10 size-4"
          />
          <Input className="pl-11" label="E-mail" placeholder="voce@exemplo.com" type="email" />
        </div>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="text-neutral-500 absolute top-10 left-4 z-10 size-4"
          />
          <Input className="pl-11" label="Senha" placeholder="Sua senha" type="password" />
        </div>
        <Button className="w-full" size="large" type="submit">
          Entrar
        </Button>
      </form>

      <p className="text-neutral-500 text-center text-xs leading-relaxed">
        Demonstração do shell. A autenticação será conectada na Task 11.1.
      </p>
    </section>
  );
}
