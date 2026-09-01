import Link from 'next/link';

import { ContentPage } from '@web/components/layout/content-page';

interface PrivacySectionProps {
  children: React.ReactNode;
  id: string;
  title: string;
}

function PrivacySection({ children, id, title }: Readonly<PrivacySectionProps>) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h2 className="text-neutral-100 text-2xl font-semibold" id={id}>
        {title}
      </h2>
      <div className="text-neutral-300 grid gap-4 text-base leading-7">{children}</div>
    </section>
  );
}

export function PrivacyPageContent() {
  return (
    <ContentPage
      description="Esta página explica quais dados são tratados pelo Vavito Archives, por que eles são necessários e como são usados."
      eyebrow="Privacidade"
      title="Seus dados, sem letras miúdas."
    >
      <p className="text-neutral-500 font-mono text-xs">
        Última atualização: 30 de agosto de 2026.
      </p>

      <div className="grid gap-10">
        <PrivacySection id="privacy-data" title="Dados que podemos receber">
          <ul className="grid list-disc gap-3 pl-5">
            <li>
              <strong className="text-neutral-100">Conta:</strong> email usado na conta, nome
              público e avatar. Sua senha é protegida durante o acesso e não pode ser consultada
              pelo Vavito Archives.
            </li>
            <li>
              <strong className="text-neutral-100">Participação:</strong> comentários, respostas,
              reações e artigos salvos associados ao seu perfil autenticado.
            </li>
            <li>
              <strong className="text-neutral-100">Newsletter:</strong> email, origem e momento do
              consentimento.
            </li>
            <li>
              <strong className="text-neutral-100">Contato:</strong> nome, email e mensagem enviados
              voluntariamente pelo formulário.
            </li>
          </ul>
        </PrivacySection>

        <PrivacySection id="privacy-purpose" title="Como esses dados são usados">
          <p>
            Os dados são usados somente para oferecer as funcionalidades solicitadas: manter sua
            conta, publicar sua participação, guardar preferências, entregar a newsletter, responder
            contatos e proteger a aplicação contra abuso.
          </p>
          <p>
            O Vavito Archives não vende dados pessoais. Emails de newsletter e contato não são
            exibidos publicamente nem associados entre si automaticamente.
          </p>
        </PrivacySection>

        <PrivacySection id="privacy-services" title="Serviços essenciais">
          <p>
            Para manter o site funcionando, contamos com provedores especializados em serviços como
            acesso à conta, armazenamento, hospedagem e envio de emails. Cada provedor processa
            somente os dados necessários para prestar seu respectivo serviço.
          </p>
        </PrivacySection>

        <PrivacySection id="privacy-contact" title="Dúvidas e solicitações">
          <p>
            Para esclarecer o tratamento de dados ou solicitar ajuda com seus controles, use a{' '}
            <Link className="text-accent underline underline-offset-4" href="/contato">
              página de contato
            </Link>
            . Esta política pode ser atualizada quando as funcionalidades ou os provedores do
            projeto mudarem.
          </p>
        </PrivacySection>
      </div>
    </ContentPage>
  );
}
