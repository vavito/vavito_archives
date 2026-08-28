import type { OpenAPIObject } from '@nestjs/swagger';

export const OPENAPI_SECURITY_SCHEME = 'supabase-jwt';

export const OPENAPI_TAGS = [
  { description: 'Informações básicas da API.', name: 'API' },
  { description: 'Liveness e readiness da aplicação.', name: 'Health' },
  { description: 'Perfil do usuário autenticado.', name: 'Profiles' },
  { description: 'Consulta pública de artigos.', name: 'Posts' },
  { description: 'Administração editorial de artigos.', name: 'Admin Posts' },
  { description: 'Consulta pública de tags.', name: 'Tags' },
  { description: 'Upload administrativo de mídia editorial.', name: 'Admin Media' },
  { description: 'Comentários públicos e ações do autor.', name: 'Comments' },
  { description: 'Moderação administrativa de comentários.', name: 'Admin Comments' },
  { description: 'Reações e biblioteca privada de artigos.', name: 'Engagement' },
  { description: 'Inscrição, confirmação e cancelamento da newsletter.', name: 'Newsletter' },
  { description: 'Administração e envio de campanhas.', name: 'Admin Newsletter' },
  { description: 'Recebimento de eventos assinados de provedores.', name: 'Webhooks' },
  { description: 'Envio público de mensagens de contato.', name: 'Contact' },
] as const satisfies NonNullable<OpenAPIObject['tags']>;

export const OPENAPI_REQUEST_ID_EXAMPLE = '019c2d62-6e90-7000-8000-000000000000';
