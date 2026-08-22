import { NestFactory } from '@nestjs/core';

import { AppModule } from '@api/app.module';
import {
  MediaCleanupService,
  type MediaCleanupOptions,
} from '@api/modules/media/services/media-cleanup.service';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export class MediaCleanupCommandError extends Error {}

function numericArgument(args: string[], name: string, required: true): number;
function numericArgument(args: string[], name: string, required: false): number | undefined;
function numericArgument(args: string[], name: string, required: boolean): number | undefined {
  const prefix = `--${name}=`;
  const matches = args.filter((argument) => argument.startsWith(prefix));

  if (matches.length > 1) {
    throw new MediaCleanupCommandError(`Use --${name} apenas uma vez.`);
  }

  const rawValue = matches[0]?.slice(prefix.length);

  if (rawValue === undefined) {
    if (required) {
      throw new MediaCleanupCommandError(`Informe --${name}=<inteiro positivo>.`);
    }

    return undefined;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new MediaCleanupCommandError(`--${name} deve ser um inteiro positivo.`);
  }

  return value;
}

export function parseMediaCleanupOptions(args: string[]): MediaCleanupOptions {
  const normalizedArgs = args.filter((argument) => argument !== '--');
  const supportedArguments = normalizedArgs.every(
    (argument) =>
      argument === '--execute' ||
      argument.startsWith('--older-than-hours=') ||
      argument.startsWith('--limit='),
  );

  if (!supportedArguments) {
    throw new MediaCleanupCommandError('Argumento desconhecido no comando de limpeza de mídia.');
  }

  if (normalizedArgs.filter((argument) => argument === '--execute').length > 1) {
    throw new MediaCleanupCommandError('Use --execute apenas uma vez.');
  }

  const olderThanHours = numericArgument(normalizedArgs, 'older-than-hours', true);
  const limit = numericArgument(normalizedArgs, 'limit', false) ?? DEFAULT_LIMIT;

  if (limit > MAX_LIMIT) {
    throw new MediaCleanupCommandError(`--limit deve ser menor ou igual a ${MAX_LIMIT}.`);
  }

  return {
    dryRun: !normalizedArgs.includes('--execute'),
    limit,
    olderThanHours,
  };
}

export async function runMediaCleanupCommand(args: string[]): Promise<void> {
  const options = parseMediaCleanupOptions(args);
  const application = await NestFactory.createApplicationContext(AppModule);

  try {
    const summary = await application.get(MediaCleanupService).cleanup(options);

    if (summary.failedIds.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await application.close();
  }
}

if (require.main === module) {
  runMediaCleanupCommand(process.argv.slice(2)).catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : 'Falha desconhecida na limpeza de mídia.',
    );
    process.exitCode = 1;
  });
}
