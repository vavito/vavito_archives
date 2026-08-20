import * as Joi from 'joi';

import { environments, type EnvironmentVariables } from '@api/core/config/app.config';

const environmentSchema = Joi.object<EnvironmentVariables>({
  APP_VERSION: Joi.string()
    .pattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/)
    .default('0.0.0'),
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
  NODE_ENV: Joi.string()
    .valid(...environments)
    .default('development'),
  PORT: Joi.number().port().default(3001),
  RESEND_API_KEY: Joi.string()
    .pattern(/^re_[A-Za-z0-9_-]+$/)
    .required(),
  REVALIDATION_SECRET: Joi.string().min(32).required(),
  VIEW_FINGERPRINT_SECRET: Joi.string().min(32).required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().min(20).required(),
  SUPABASE_AVATARS_BUCKET: Joi.string().trim().min(1).default('avatars'),
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
  'RESEND_API_KEY',
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
