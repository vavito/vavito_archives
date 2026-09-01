import { expect, test } from '@playwright/test';

test.describe('páginas públicas', () => {
  test('navega da Home para a listagem e conclui a leitura de um artigo', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Ideias e aprendizados de quem constrói software.',
      }),
    ).toBeVisible();
    await expect(page.getByText('2', { exact: true }).first()).toBeVisible();

    await page.getByRole('link', { name: 'Explorar todos os artigos' }).click();
    await expect(page).toHaveURL('/artigos');
    await expect(page.getByRole('heading', { level: 1, name: 'Artigos' })).toBeVisible();
    await expect(page.getByText('2 publicações encontradas')).toBeVisible();

    await page.getByRole('link', { name: 'Ler Arquitetura NestJS' }).click();
    await expect(page).toHaveURL('/artigos/arquitetura-nestjs');
    await expect(page.getByRole('heading', { level: 1, name: 'Arquitetura NestJS' })).toBeVisible();
    await expect(
      page.getByText('Este conteúdo confirma que a leitura completa foi carregada.'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Artigos relacionados' })).toBeVisible();
  });

  test('busca um artigo e abre o resultado selecionado', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Buscar artigos' }).click();

    const input = page.getByRole('combobox', { name: 'Buscar artigos' });
    await input.fill('prisma');

    const result = page.getByRole('link', { name: /Prisma com PostgreSQL/u });
    await expect(result).toBeVisible();
    await result.click();

    await expect(page).toHaveURL('/artigos/prisma-com-postgresql');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Prisma com PostgreSQL' }),
    ).toBeVisible();
  });

  test('apresenta uma mensagem amigável quando o servidor falha', async ({ page }) => {
    await page.goto('/artigos?tag=erro');

    await expect(
      page.getByRole('heading', { name: 'Não foi possível carregar os artigos.' }),
    ).toBeVisible();
    await expect(
      page.getByText(
        'Não conseguimos buscar os artigos agora. Tente novamente em alguns instantes.',
      ),
    ).toBeVisible();
    await expect(page.getByText(/API|stack|503/u)).toHaveCount(0);
  });

  test('mantém a navegação e o rodapé acessíveis no tamanho da tela', async ({
    page,
  }, testInfo) => {
    await page.goto('/sobre');

    const desktopNavigation = page.getByRole('navigation', { name: 'Navegação principal' });
    const mobileNavigation = page.getByRole('navigation', { name: 'Navegação móvel' });

    if (testInfo.project.name === 'mobile-chromium') {
      await expect(desktopNavigation).toBeHidden();
      await expect(mobileNavigation).toBeVisible();
      await page.locator('footer').scrollIntoViewIfNeeded();

      const footerBox = await page.locator('footer').boundingBox();
      const mobileNavigationBox = await mobileNavigation.boundingBox();

      expect(footerBox).not.toBeNull();
      expect(mobileNavigationBox).not.toBeNull();
      expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(mobileNavigationBox.y + 1);
      return;
    }

    await expect(desktopNavigation).toBeVisible();
    await expect(mobileNavigation).toBeHidden();
  });
});
