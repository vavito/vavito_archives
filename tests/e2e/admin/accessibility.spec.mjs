import { expect, test } from '@playwright/test';

import { expectNoAccessibilityViolations, expectVisibleFocus } from '../support/accessibility.mjs';

async function loginAsAdmin(page) {
  await page.goto('/auth?next=/admin/posts');
  await page.getByLabel('E-mail', { exact: true }).fill('admin-e2e@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('Admin@E2E123');
  await page.getByRole('button', { exact: true, name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/u);
}

test('editor oferece campos, ferramentas e salvamento acessíveis pelo teclado', async ({
  page,
}) => {
  await loginAsAdmin(page);
  await page.getByRole('link', { name: 'Novo artigo' }).click();

  const title = page.getByLabel('Título do artigo');
  const excerpt = page.getByLabel('Resumo do artigo');
  const slug = page.getByLabel('Endereço do artigo');
  const tags = page.getByLabel('Tópicos do artigo');
  const content = page.getByRole('textbox', { name: 'Conteúdo do artigo' });
  const toolbar = page.getByRole('toolbar', { name: 'Ferramentas de formatação' });

  await expectNoAccessibilityViolations(page);

  await page.getByRole('link', { name: 'Voltar ao painel' }).focus();
  await page.keyboard.press('Tab');
  await expectVisibleFocus(title);
  await page.keyboard.press('Tab');
  await expect(excerpt).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(slug).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(tags).toBeFocused();

  await title.fill('Artigo acessível');
  await excerpt.fill('Resumo usado para validar o anúncio de salvamento.');
  await slug.fill('artigo-acessivel');
  await content.fill('Conteúdo editável pelo teclado.');

  await expect(toolbar.getByRole('button', { name: 'Negrito' })).toHaveAttribute(
    'aria-keyshortcuts',
    /Control\+B/u,
  );
  await content.press('Control+A');
  await content.press('Control+B');
  await toolbar.getByRole('button', { name: 'Citação' }).focus();
  await page.keyboard.press('Tab');
  await expectVisibleFocus(content);
  await expect(content.locator('strong')).toHaveText('Conteúdo editável pelo teclado.');
  await expect(page.getByRole('status').filter({ hasText: 'Rascunho salvo' })).toBeVisible();

  await expectNoAccessibilityViolations(page);
});
