export const environments = ['development', 'test', 'production'] as const;

export type AppEnvironment = (typeof environments)[number];

export interface ApplicationConfig {
  app: {
    environment: AppEnvironment;
    frontendUrl: string;
    port: number;
    swaggerEnabled: boolean;
    version: string;
  };
  database: {
    connectOnStart: boolean;
    directUrl: string;
    url: string;
  };
  resend: {
    apiKey: string;
  };
  security: {
    revalidationSecret: string;
  };
  supabase: {
    avatarsBucket: string;
    serviceRoleKey: string;
    url: string;
  };
}

export interface EnvironmentVariables {
  APP_VERSION: string;
  DATABASE_CONNECT_ON_START: boolean;
  DATABASE_URL: string;
  DIRECT_URL: string;
  FRONTEND_URL: string;
  NODE_ENV: AppEnvironment;
  PORT: number;
  RESEND_API_KEY: string;
  REVALIDATION_SECRET: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_AVATARS_BUCKET: string;
  SUPABASE_URL: string;
  SWAGGER_ENABLED: boolean;
}
