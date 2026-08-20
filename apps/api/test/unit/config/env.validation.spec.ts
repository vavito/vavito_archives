import { validateEnvironment } from '@api/core/config/env.validation';

function validEnvironment(): Record<string, unknown> {
  return {
    DIRECT_URL: 'postgresql://postgres:postgres@localhost:5432/vavito_test',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/vavito_test',
    FRONTEND_URL: 'http://localhost:3000',
    RESEND_API_KEY: 're_valid_test_key',
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
      DATABASE_CONNECT_ON_START: true,
      NODE_ENV: 'development',
      PORT: 3001,
      SUPABASE_AVATARS_BUCKET: 'avatars',
      SWAGGER_ENABLED: true,
    });
  });

  it('rejeita configuração obrigatória ausente ou inválida', () => {
    const environment = validEnvironment();
    delete environment.DATABASE_URL;
    delete environment.DIRECT_URL;
    environment.FRONTEND_URL = 'endereco-invalido';
    environment.PORT = 70_000;

    expect(() => validateEnvironment(environment)).toThrow('Invalid environment configuration:');

    try {
      validateEnvironment(environment);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('DATABASE_URL');
      expect((error as Error).message).toContain('DIRECT_URL');
      expect((error as Error).message).toContain('FRONTEND_URL');
      expect((error as Error).message).toContain('PORT');
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
