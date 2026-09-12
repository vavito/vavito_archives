import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const SERVER_ONLY_VARIABLES = [
  'NEWSLETTER_TOKEN_SECRET',
  'RESEND_API_KEY',
  'RESEND_WEBHOOK_SECRET',
  'REVALIDATION_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VIEW_FINGERPRINT_SECRET',
];

const SECRET_PATTERNS = [
  { label: 'chave privada', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u },
  { label: 'token da API do Resend', pattern: /\bre_[A-Za-z0-9_-]{24,}\b/u },
  { label: 'segredo de webhook', pattern: /\bwhsec_[A-Za-z0-9+/_=-]{24,}/u },
  { label: 'chave secreta do Supabase', pattern: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/u },
  { label: 'token pessoal do GitHub', pattern: /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}\b/u },
];

const SAFE_FIXTURE_MARKERS =
  /example|fixture|placeholder|replace|[_-]test[_-]|valid[_-]?test|x{4,}/iu;

function reviewableFiles() {
  return execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)
    .map((path) => path.replaceAll('\\', '/'));
}

function readableText(path) {
  try {
    const content = readFileSync(path, 'utf8');
    return content.includes('\0') ? null : content;
  } catch {
    return null;
  }
}

const violations = [];

for (const path of reviewableFiles()) {
  const filename = basename(path);

  if (/^\.env(?:\.|$)/u.test(filename) && filename !== '.env.example') {
    violations.push(`${path}: arquivo de ambiente não deve ser versionado`);
  }

  const content = readableText(path);
  if (content === null) continue;

  if (path.startsWith('apps/web/src/') || path.startsWith('apps/web/public/')) {
    for (const variable of SERVER_ONLY_VARIABLES) {
      if (content.includes(variable)) {
        violations.push(`${path}: referência client-side à variável server-only ${variable}`);
      }
    }
  }

  for (const { label, pattern } of SECRET_PATTERNS) {
    const match = content.match(pattern)?.[0];
    if (match && !SAFE_FIXTURE_MARKERS.test(match)) {
      violations.push(`${path}: possível ${label}`);
    }
  }
}

if (violations.length > 0) {
  console.error('A verificação encontrou possíveis segredos ou limites de ambiente violados:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('Nenhum segredo versionado ou referência client-side indevida foi encontrado.');
}
