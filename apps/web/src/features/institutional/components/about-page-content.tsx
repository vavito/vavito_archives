import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ContentPage } from '@web/components/layout/content-page';

export function AboutPageContent() {
  return (
    <ContentPage
      description="Um espaço pessoal para organizar ideias, dividir aprendizados e tornar visíveis as decisões que existem por trás de um software."
      eyebrow="Sobre"
      title="Construir, entender e registrar."
    >
      <div className="text-neutral-300 grid gap-8 text-base leading-7">
        <section aria-labelledby="about-author" className="grid gap-4">
          <h2 className="text-neutral-100 text-2xl font-semibold" id="about-author">
            Oi, eu sou o João Victor.
          </h2>
          <p>
            Sou desenvolvedor de software e criei o Vavito Archives como um arquivo vivo das coisas
            que aprendo enquanto projeto, implemento e evoluo aplicações reais.
          </p>
          <p>
            Os textos nascem de problemas concretos: uma decisão de arquitetura, um detalhe de
            domínio, uma integração que exigiu cuidado ou uma ideia que ficou mais clara depois de
            ser colocada em prática.
          </p>
        </section>

        <blockquote className="text-neutral-300 border-l-2 border-accent pl-5 text-lg leading-relaxed italic">
          “Escrever é uma forma de revisar o que foi construído e descobrir o que ainda não foi
          compreendido.”
        </blockquote>

        <section aria-labelledby="about-purpose" className="grid gap-4">
          <h2 className="text-neutral-100 text-2xl font-semibold" id="about-purpose">
            Por que “Archives”?
          </h2>
          <p>
            Porque conhecimento técnico envelhece, muda de contexto e ganha novas interpretações. O
            objetivo não é produzir respostas definitivas, mas preservar raciocínios úteis e
            permitir que eles sejam revisitados.
          </p>
          <p>
            Aqui você encontra conteúdos sobre desenvolvimento, arquitetura, produto e os bastidores
            de transformar requisitos em software sustentável.
          </p>
        </section>

        <div className="flex flex-wrap gap-5 border-t border-divider pt-6">
          <Link
            className="text-neutral-200 hover:text-accent inline-flex items-center gap-2 text-sm font-medium transition-colors"
            href="/artigos"
          >
            Explorar os artigos
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link
            className="text-neutral-400 hover:text-neutral-100 text-sm transition-colors"
            href="/contato"
          >
            Entrar em contato
          </Link>
        </div>
      </div>
    </ContentPage>
  );
}
