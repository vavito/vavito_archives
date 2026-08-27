export const environments = ['development', 'test', 'production'] as const;

export type AppEnvironment = (typeof environments)[number];

export interface ApplicationConfig {
  app: {
    corsAllowedOrigins: string[];
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
    adminRecipient: string;
    apiKey: string;
    contactFrom: string;
    maxAttempts: number;
    newsletterFrom: string;
    replyTo: string;
    timeoutMs: number;
    webhookSecret: string;
  };
  security: {
    newsletterTokenSecret: string;
    revalidationSecret: string;
    viewFingerprintSecret: string;
  };
  supabase: {
    avatarsBucket: string;
    mediaBucket: string;
    serviceRoleKey: string;
    url: string;
  };
}

export interface EnvironmentVariables {
  APP_VERSION: string;
  CORS_ALLOWED_ORIGINS: string;
  DATABASE_CONNECT_ON_START: boolean;
  DATABASE_URL: string;
  DIRECT_URL: string;
  FRONTEND_URL: string;
  MAIL_ADMIN_RECIPIENT: string;
  MAIL_CONTACT_FROM: string;
  MAIL_NEWSLETTER_FROM: string;
  MAIL_REPLY_TO: string;
  NODE_ENV: AppEnvironment;
  PORT: number;
  RESEND_API_KEY: string;
  RESEND_MAX_ATTEMPTS: number;
  RESEND_TIMEOUT_MS: number;
  RESEND_WEBHOOK_SECRET: string;
  NEWSLETTER_TOKEN_SECRET: string;
  REVALIDATION_SECRET: string;
  VIEW_FINGERPRINT_SECRET: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_AVATARS_BUCKET: string;
  SUPABASE_MEDIA_BUCKET: string;
  SUPABASE_URL: string;
  SWAGGER_ENABLED: boolean;
}
