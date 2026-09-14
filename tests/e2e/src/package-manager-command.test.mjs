import assert from 'node:assert/strict';
import test from 'node:test';

import { packageManagerCommand } from '../support/package-manager-command.mjs';

test('executa uma CLI JavaScript do pnpm com o runtime Node.js', () => {
  assert.deepEqual(
    packageManagerCommand(['install'], {
      execPath: '/usr/local/bin/node',
      npmExecPath: '/workspace/pnpm.cjs',
      platform: 'linux',
    }),
    {
      args: ['/workspace/pnpm.cjs', 'install'],
      command: '/usr/local/bin/node',
      shell: false,
    },
  );
});

test('executa diretamente o binário nativo do pnpm no Linux', () => {
  assert.deepEqual(
    packageManagerCommand(['--filter', '@vavito/web', 'build'], {
      execPath: '/usr/local/bin/node',
      npmExecPath: '/home/runner/setup-pnpm/pnpm',
      platform: 'linux',
    }),
    {
      args: ['--filter', '@vavito/web', 'build'],
      command: '/home/runner/setup-pnpm/pnpm',
      shell: false,
    },
  );
});

test('usa o shim do PATH para uma CLI nativa do pnpm no Windows', () => {
  assert.deepEqual(
    packageManagerCommand(['build'], {
      npmExecPath: 'C:\\Program Files\\pnpm\\pnpm.cmd',
      platform: 'win32',
    }),
    {
      args: ['build'],
      command: 'pnpm.cmd',
      shell: true,
    },
  );
});

test('usa o comando compatível com a plataforma quando npm_execpath não existe', () => {
  assert.deepEqual(
    packageManagerCommand(['test'], {
      npmExecPath: null,
      platform: 'win32',
    }),
    {
      args: ['test'],
      command: 'pnpm.cmd',
      shell: true,
    },
  );
});
