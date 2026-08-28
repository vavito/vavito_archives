'use client';

import {
  Button,
  Chip,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from '@vavito/ui';
import { ArrowRight, Bell, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';

const topics = ['Todos', 'Backend', 'Arquitetura'];

function ComponentSection({
  children,
  description,
  title,
}: Readonly<{
  children: React.ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <section className="bg-surface-card grid gap-6 rounded-2xl border border-border p-5 sm:p-6">
      <div className="grid gap-1.5">
        <h2 className="text-neutral-100 text-lg font-semibold">{title}</h2>
        <p className="text-neutral-400 text-sm leading-relaxed">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function DesignSystemDemo() {
  const [activeTopic, setActiveTopic] = useState('Todos');

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="grid max-w-prose gap-4">
        <p className="text-accent text-xs font-medium tracking-eyebrow uppercase">
          Design system · Task 9.3
        </p>
        <h1 className="text-neutral-100 text-4xl leading-tight font-semibold sm:text-5xl">
          Componentes base do Vavito Archives
        </h1>
        <p className="text-neutral-400 max-w-reading text-base leading-relaxed">
          Demonstração interna das fontes, variantes, estados interativos e comportamentos
          acessíveis.
        </p>
        <code className="font-mono text-neutral-500 text-xs">Inter + JetBrains Mono</code>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <ComponentSection
          title="Button"
          description="Ações primárias, secundárias, destrutivas, com ícone e desabilitadas."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button>
              Continuar
              <ArrowRight aria-hidden="true" />
            </Button>
            <Button variant="secondary">Salvar rascunho</Button>
            <Button variant="danger">
              <Trash2 aria-hidden="true" />
              Excluir
            </Button>
            <Button aria-label="Ver notificações" size="icon" variant="ghost">
              <Bell aria-hidden="true" />
            </Button>
            <Button disabled>Publicar</Button>
          </div>
        </ComponentSection>

        <ComponentSection
          title="Chip"
          description="Filtros selecionáveis comunicam o estado também por aria-pressed."
        >
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Chip
                key={topic}
                active={activeTopic === topic}
                onClick={() => setActiveTopic(topic)}
              >
                {activeTopic === topic ? <Check aria-hidden="true" /> : null}
                {topic}
              </Chip>
            ))}
            <Chip disabled>Indisponível</Chip>
          </div>
        </ComponentSection>

        <ComponentSection
          title="Input"
          description="Rótulo, ajuda, erro e estado desabilitado possuem semântica associada."
        >
          <div className="grid gap-5">
            <Input
              description="Usaremos este endereço apenas para atualizações do artigo."
              label="E-mail"
              placeholder="voce@exemplo.com"
              type="email"
            />
            <Input
              error="Informe um endereço de e-mail válido."
              label="E-mail com erro"
              defaultValue="email-invalido"
            />
            <Input disabled label="Campo desabilitado" value="Somente leitura" readOnly />
          </div>
        </ComponentSection>

        <ComponentSection
          title="Dialog"
          description="Modal com foco contido, fechamento por Escape e conteúdo anunciado."
        >
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Abrir demonstração</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ativar notificações?</DialogTitle>
                  <DialogDescription>
                    Você receberá avisos quando houver novidades nos artigos acompanhados.
                  </DialogDescription>
                </DialogHeader>
                <Input label="E-mail para avisos" placeholder="voce@exemplo.com" type="email" />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">Agora não</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button>Ativar</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </ComponentSection>
      </div>
    </div>
  );
}
