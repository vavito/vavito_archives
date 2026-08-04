import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import test from 'node:test';

test('o monorepo contém as duas aplicações', async () => {
  await Promise.all([
    access(new URL('../../../apps/api/package.json', import.meta.url)),
    access(new URL('../../../apps/web/package.json', import.meta.url)),
  ]);

  assert.ok(true);
});
