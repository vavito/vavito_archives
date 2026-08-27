import { validateEnvironment } from '@api/core/config/env.validation';

function validEnvironment(): Record<string, unknown> {
  return {
    DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/vavito_test',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/vavito_test',
    FRONTEND_URL: 'http://localhost:3000',
    MAIL_ADMIN_RECIPIENT: 'admin@example.com',
    MAIL_CONTACT_FROM: 'Vavito Archives <notifications@contact.vavitoarchives.com.br>',
    MAIL_NEWSLETTER_FROM: 'Vavito Archives <newsletter@newsletter.vavitoarchives.com.br>',
    MAIL_REPLY_TO: 'contato@example.com',
    NEWSLETTER_TOKEN_SECRET: 'valid_newsletter_token_secret_at_least_32_characters',
    RESEND_API_KEY: 're_valid_test_key',
    RESEND_WEBHOOK_SECRET: 'whsec_valid+test/secret=',
    REVALIDATION_SECRET: 'valid_revalidation_secret_at_least_32_characters',
    VIEW_FINGERPRINT_SECRET: 'valid_view_fingerprint_secret_at_least_32_characters',
    SUPABASE_SERVICE_ROLE_KEY: 'valid_service_role_key_value',
    SUPABASE_URL: 'http://127.0.0.1:54321',
  };
}

describe('validateEnvironment', () => {
  it('aplica os padrões seguros para desenvolvimento', () => {
    const environment = validateEnvironment(validEnvironment());

    expect(environment).toMatchObject({
      APP_VERSION: '0.0.0',
      CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
      DATABASE_CONNECT_ON_START: true,
      NODE_ENV: 'development',
      PORT: 3001,
      RESEND_MAX_ATTEMPTS: 3,
      RESEND_TIMEOUT_MS: 5_000,
      RESEND_WEBHOOK_SECRET: 'whsec_valid+test/secret=',
      SUPABASE_AVATARS_BUCKET: 'avatars',
      SUPABASE_MEDIA_BUCKET: 'media',
      SWAGGER_ENABLED: true,
    });
  });

  it('aceita somente origins HTTP(S) exatas no CORS', () => {
    expect(
      validateEnvironment({
        ...validEnvironment(),
        CORS_ALLOWED_ORIGINS: 'https://vavitoarchives.com.br,https://preview.example.com',
      }).CORS_ALLOWED_ORIGINS,
    ).toBe('https://vavitoarchives.com.br,https://preview.example.com');

    for (const value of ['*', 'https://*.example.com', 'https://example.com/app']) {
      expect(() =>
        validateEnvironment({ ...validEnvironment(), CORS_ALLOWED_ORIGINS: value }),
      ).toThrow('CORS_ALLOWED_ORIGINS');
    }
  });

  it('rejeita configuração obrigatória ausente ou inválida', () => {
    const environment = validEnvironment();
    const invalidWebhookSecret = 'segredo-invalido';
    delete environment.DATABASE_URL;
    delete environment.DIRECT_URL;
    environment.FRONTEND_URL = 'endereco-invalido';
    environment.MAIL_ADMIN_RECIPIENT = 'email-invalido';
    environment.MAIL_CONTACT_FROM = 'remetente-invalido';
    environment.PORT = 70_000;
    environment.RESEND_WEBHOOK_SECRET = invalidWebhookSecret;

    expect(() => validateEnvironment(environment)).toThrow('Invalid environment configuration:');

    try {
      validateEnvironment(environment);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('DATABASE_URL');
      expect((error as Error).message).toContain('DIRECT_URL');
      expect((error as Error).message).toContain('FRONTEND_URL');
      expect((error as Error).message).toContain('MAIL_ADMIN_RECIPIENT');
      expect((error as Error).message).toContain('MAIL_CONTACT_FROM');
      expect((error as Error).message).toContain('PORT');
      expect((error as Error).message).toContain('RESEND_WEBHOOK_SECRET');
      expect((error as Error).message).not.toContain(invalidWebhookSecret);
    }
  });

  it('desabilita o Swagger por padrão em produção', () => {
    const environment = validateEnvironment({
      ...validEnvironment(),
      NODE_ENV: 'production',
    });

    expect(environment.SWAGGER_ENABLED).toBe(false);
  });

  it('rejeita segredos placeholder em produção', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment(),
        NODE_ENV: 'production',
        RESEND_API_KEY: 're_replace_me',
      }),
    ).toThrow(
      'Invalid production environment configuration: placeholder values are not allowed for RESEND_API_KEY.',
    );
  });
});
