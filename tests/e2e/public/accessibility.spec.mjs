import { expect, test } from '@playwright/test';

import { expectNoAccessibilityViolations, expectVisibleFocus } from '../support/accessibility.mjs';

test.describe('acessibilidade pública', () => {
  test('busca anuncia resultados e mantém o fluxo completo pelo teclado', async ({ page }) => {
    await page.goto('/');

    const trigger = page.getByRole('button', { name: 'Buscar artigos' });
    await trigger.focus();
    await expectVisibleFocus(trigger);
    await page.keyboard.press('Control+K');

    const dialog = page.getByRole('dialog', { name: 'Buscar artigos' });
    const input = page.getByRole('combobox', { name: 'Buscar artigos' });
    await expect(dialog).toBeVisible();
    await expectVisibleFocus(input);

    await input.fill('prisma');
    const results = page.getByRole('listbox', { name: 'Resultados da busca' });
    await expect(results).toBeVisible();
    await expect(dialog.locator('[aria-live="polite"]')).toContainText('Prisma com PostgreSQL');

    await input.press('ArrowDown');
    const firstResult = page.getByRole('option').first();
    await expect(firstResult).toHaveAttribute('aria-selected', 'true');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      await firstResult.getAttribute('id'),
    );

    await expectNoAccessibilityViolations(page, '[role="dialog"]');

    await input.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('navegação mobile expõe página atual e ordem previsível de foco', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'mobile-chromium',
      'A ordem por Tab é validada no navegador mobile com tabulação de links habilitada.',
    );

    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Navegação móvel' });
    const home = navigation.getByRole('link', { name: 'Início' });
    const articles = navigation.getByRole('link', { name: 'Artigos' });
    const saved = navigation.getByRole('link', { name: 'Salvos' });
    const profile = navigation.getByRole('link', { name: 'Perfil' });

    await expect(home).toHaveAttribute('aria-current', 'page');
    await home.focus();
    await expectVisibleFocus(home);
    await page.keyboard.press('Tab');
    await expect(articles).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(saved).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(profile).toBeFocused();

    await expectNoAccessibilityViolations(page, 'nav[aria-label="Navegação móvel"]');
  });
});
