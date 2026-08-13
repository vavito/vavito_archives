import { Client } from 'pg';

import { requireIntegrationDatabaseUrl } from './database-url';

async function main(): Promise<void> {
  const client = new Client({
    connectionString: requireIntegrationDatabaseUrl(),
  });

  try {
    await client.connect();
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS auth;

      CREATE TABLE IF NOT EXISTS auth.users (
        id UUID PRIMARY KEY,
        email TEXT,
        raw_user_meta_data JSONB NOT NULL DEFAULT '{}'::JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    await client.end();
  }
}

void main();
