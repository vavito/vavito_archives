import { requireIntegrationDatabaseUrl } from './integration/database-url';

describe('URL do PostgreSQL de integração', () => {
  it('aceita somente o banco local reservado para integração', () => {
    const connectionString = 'postgresql://postgres:postgres@localhost:5432/vavito_integration';

    expect(requireIntegrationDatabaseUrl({ INTEGRATION_DATABASE_URL: connectionString })).toBe(
      connectionString,
    );
  });

  it('recusa hosts remotos, inclusive uma URL do Supabase', () => {
    expect(() =>
      requireIntegrationDatabaseUrl({
        INTEGRATION_DATABASE_URL:
          'postgresql://postgres:secret@db.project.supabase.co:5432/vavito_integration',
      }),
    ).toThrow('deve apontar para o banco local vavito_integration');
  });

  it('recusa outro banco mesmo quando o PostgreSQL é local', () => {
    expect(() =>
      requireIntegrationDatabaseUrl({
        INTEGRATION_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres',
      }),
    ).toThrow('deve apontar para o banco local vavito_integration');
  });
});
