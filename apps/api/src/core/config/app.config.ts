export const environments = ['development', 'test', 'production'] as const;

export type AppEnvironment = (typeof environments)[number];

export interface ApplicationConfig {
  app: {
    environment: AppEnvironment;
    frontendUrl: string;
    port: number;
    version: string;
  };
  database: {
    url: string;
  };
  resend: {
    apiKey: string;
  };
  security: {
    revalidationSecret: string;
  };
  supabase: {
    serviceRoleKey: string;
    url: string;
  };
}

export interface EnvironmentVariables {
  APP_VERSION: string;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  NODE_ENV: AppEnvironment;
  PORT: number;
  RESEND_API_KEY: string;
  REVALIDATION_SECRET: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
}
