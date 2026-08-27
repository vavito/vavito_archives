import * as Joi from 'joi';

import { environments, type EnvironmentVariables } from '@api/core/config/app.config';

const mailboxPattern =
  /^(?:[^<>\r\n]+\s+<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>|[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)$/;

function exactOrigins(value: string, helpers: Joi.CustomHelpers): string | Joi.ErrorReport {
  const origins = value.split(',').map((origin) => origin.trim());

  if (origins.some((origin) => !origin || origin.includes('*'))) {
    return helpers.error('string.exactOrigins');
  }

  try {
    for (const origin of origins) {
      const url = new URL(origin);

      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.pathname !== '/' ||
        url.search ||
        url.hash
      ) {
        return helpers.error('string.exactOrigins');
      }
    }
  } catch {
    return helpers.error('string.exactOrigins');
  }

  return origins.join(',');
}

const environmentSchema = Joi.object<EnvironmentVariables>({
  APP_VERSION: Joi.string()
    .pattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
    .default('0.0.0'),
  CORS_ALLOWED_ORIGINS: Joi.string()
    .custom(exactOrigins)
    .default(Joi.ref('FRONTEND_URL'))
    .messages({
      'string.exactOrigins':
        '"CORS_ALLOWED_ORIGINS" must contain only exact HTTP(S) origins separated by commas',
    }),
  DATABASE_CONNECT_ON_START: Joi.boolean().default(true),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  DIRECT_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  MAIL_ADMIN_RECIPIENT: Joi.string().email().required(),
  MAIL_CONTACT_FROM: Joi.string().trim().pattern(mailboxPattern).required(),
  MAIL_NEWSLETTER_FROM: Joi.string().trim().pattern(mailboxPattern).required(),
  MAIL_REPLY_TO: Joi.string().email().required(),
  NODE_ENV: Joi.string()
    .valid(...environments)
    .default('development'),
  PORT: Joi.number().port().default(3001),
  NEWSLETTER_TOKEN_SECRET: Joi.string().min(32).required(),
  RESEND_API_KEY: Joi.string()
    .pattern(/^re_[A-Za-z0-9_-]+$/)
    .required(),
  RESEND_MAX_ATTEMPTS: Joi.number().integer().min(1).max(3).default(3),
  RESEND_TIMEOUT_MS: Joi.number().integer().min(1_000).max(30_000).default(5_000),
  RESEND_WEBHOOK_SECRET: Joi.string()
    .pattern(/^whsec_[A-Za-z0-9+/_=-]+$/)
    .messages({
      'string.pattern.base': '"RESEND_WEBHOOK_SECRET" has invalid format',
    })
    .required(),
  REVALIDATION_SECRET: Joi.string().min(32).required(),
  VIEW_FINGERPRINT_SECRET: Joi.string().min(32).required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().min(20).required(),
  SUPABASE_AVATARS_BUCKET: Joi.string().trim().min(1).default('avatars'),
  SUPABASE_MEDIA_BUCKET: Joi.string().trim().min(1).default('media'),
  SUPABASE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  SWAGGER_ENABLED: Joi.boolean().when('NODE_ENV', {
    is: 'production',
    otherwise: Joi.boolean().default(true),
    then: Joi.boolean().default(false),
  }),
});

const secretVariableNames = [
  'NEWSLETTER_TOKEN_SECRET',
  'RESEND_API_KEY',
  'RESEND_WEBHOOK_SECRET',
  'REVALIDATION_SECRET',
  'VIEW_FINGERPRINT_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function validateEnvironment(environment: Record<string, unknown>): EnvironmentVariables {
  const result = environmentSchema.validate(environment, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  });

  if (result.error) {
    const details = result.error.details.map(({ message }) => message).join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  if (result.value.NODE_ENV === 'production') {
    const placeholderVariables = secretVariableNames.filter((name) =>
      /placeholder|replace/i.test(result.value[name]),
    );

    if (placeholderVariables.length > 0) {
      throw new Error(
        `Invalid production environment configuration: placeholder values are not allowed for ${placeholderVariables.join(', ')}.`,
      );
    }
  }

  return result.value;
}
