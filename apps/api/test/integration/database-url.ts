const allowedIntegrationHosts = new Set(['127.0.0.1', 'localhost']);
const integrationDatabaseName = 'vavito_integration';

export function requireIntegrationDatabaseUrl(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const connectionString = environment.INTEGRATION_DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error('Defina INTEGRATION_DATABASE_URL para executar os testes de integração.');
  }

  let databaseUrl: URL;

  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error('INTEGRATION_DATABASE_URL possui formato inválido.');
  }

  const databaseName = decodeURIComponent(databaseUrl.pathname.slice(1));
  const usesPostgreSql = ['postgres:', 'postgresql:'].includes(databaseUrl.protocol);
  const usesAllowedHost = allowedIntegrationHosts.has(databaseUrl.hostname);

  if (!usesPostgreSql || !usesAllowedHost || databaseName !== integrationDatabaseName) {
    throw new Error('INTEGRATION_DATABASE_URL deve apontar para o banco local vavito_integration.');
  }

  return connectionString;
}
