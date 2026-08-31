import { ContentPage } from '@web/components/layout/content-page';

import { ContactForm } from './contact-form';

export function ContactPageContent() {
  return (
    <ContentPage
      description="Sugestões de pauta, dúvidas sobre um artigo ou conversas sobre desenvolvimento são bem-vindas."
      eyebrow="Contato"
      title="Vamos conversar."
    >
      <div className="grid gap-6">
        <p className="text-neutral-400 text-sm leading-relaxed">
          Preencha os campos abaixo. A mensagem será armazenada para acompanhamento e uma
          notificação será enviada ao administrador do site.
        </p>
        <ContactForm />
      </div>
    </ContentPage>
  );
}
