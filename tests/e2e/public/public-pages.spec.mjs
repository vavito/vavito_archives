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

  test('busca um artigo e abre o resultado selecionado', async ({ page, request }) => {
    // Compile the development route before measuring the browser interaction.
    expect((await request.get('/api/posts/search?q=prisma')).ok()).toBe(true);
    // The phone must never contact the backend host directly.
    await page.route('http://127.0.0.1:4100/**', (route) => route.abort());
    await page.goto('/');
    await page.getByRole('button', { name: 'Buscar artigos' }).click();

    const dialog = page.getByRole('dialog');
    const centerOffset = () =>
      dialog.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return Math.abs(bounds.top + bounds.height / 2 - globalThis.innerHeight / 2);
      });
    await expect.poll(centerOffset).toBeLessThanOrEqual(2);

    const input = page.getByRole('combobox', { name: 'Buscar artigos' });
    await input.fill('prisma');

    const result = page.getByRole('link', { name: /Prisma com PostgreSQL/u });
    await expect(result).toBeVisible();
    await expect.poll(centerOffset).toBeLessThanOrEqual(2);
    await result.hover();
    expect(
      await page
        .getByRole('dialog')
        .evaluate((dialog) =>
          [...dialog.querySelectorAll('*')].every(
            (el) =>
              el.scrollWidth <= el.clientWidth + 1 ||
              globalThis.getComputedStyle(el).overflowX === 'hidden',
          ),
        ),
    ).toBe(true);
    await result.click();

    await expect(page).toHaveURL('/artigos/prisma-com-postgresql');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Prisma com PostgreSQL' }),
    ).toBeVisible();
  });

  test('ordena artigos em quatro sentidos e preserva a escolha ao filtrar', async ({ page }) => {
    await page.goto('/artigos');
    const sort = page.getByRole('combobox', { name: 'Ordenar por' });
    const cards = page.locator('section[aria-labelledby="articles-list-title"] article');
    for (const [value, title] of [
      ['oldest', 'Prisma com PostgreSQL'],
      ['recent', 'Arquitetura NestJS'],
      ['least-viewed', 'Prisma com PostgreSQL'],
      ['popular', 'Arquitetura NestJS'],
    ]) {
      await sort.selectOption(value);
      await expect(page).toHaveURL(new RegExp(`sort=${value}`, 'u'));
      await expect(cards.first()).toContainText(title);
      await expect(sort).toBeEnabled();
    }
    await page
      .getByRole('navigation', { name: 'Filtros da listagem de artigos' })
      .getByRole('link', { name: /TypeScript/u })
      .click();
    await expect(page).toHaveURL(/sort=popular/u);
  });

  test('autor, progresso fixo e compartilhamento por cópia', async ({ page }, testInfo) => {
    await page.goto('/artigos/arquitetura-nestjs');
    await expect(page.getByLabel('Autor do artigo')).toContainText('João Victor');
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: () => {
          throw new Error('Não deve compartilhar');
        },
      });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
      globalThis.document.execCommand = () => true;
    });
    await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Link copiado' })).toBeVisible();
    const progress = page.getByRole('progressbar', { name: 'Progresso de leitura' });
    await page.evaluate(() => {
      const content = globalThis.document.getElementById('article-reading-content');
      globalThis.scrollTo(
        0,
        content.getBoundingClientRect().bottom +
          globalThis.scrollY -
          globalThis.innerHeight / 2 +
          1,
      );
    });
    await expect(progress).toHaveAttribute('aria-valuenow', '100');
    expect((await progress.boundingBox()).y).toBe(0);
    await page.evaluate(() => globalThis.scrollTo(0, 0));
    expect((await progress.boundingBox()).y).toBe(0);
    await page.screenshot({ path: testInfo.outputPath('article.png'), fullPage: true });
  });

  test('progresso começa no texto e acompanha um artigo longo até o final', async ({ page }) => {
    await page.goto('/artigos/leitura-longa');
    const bar = page.getByRole('progressbar', { name: 'Progresso de leitura' });
    await expect(bar).toHaveAttribute('aria-valuenow', '0');
    for (const percent of [25, 50, 75, 100]) {
      await page.evaluate((position) => {
        const content = globalThis.document.getElementById('article-reading-content');
        const bounds = content.getBoundingClientRect();
        const start = Math.max(0, bounds.top + globalThis.scrollY - globalThis.innerHeight / 2);
        const end = bounds.bottom + globalThis.scrollY - globalThis.innerHeight / 2;
        globalThis.scrollTo(0, start + ((end - start) * position) / 100);
      }, percent);
      await expect(bar).toHaveAttribute('aria-valuenow', String(percent));
      expect((await bar.boundingBox()).y).toBe(0);
    }
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
    isMobile,
  }) => {
    await page.goto('/sobre');

    const desktopNavigation = page.getByRole('navigation', { name: 'Navegação principal' });
    const mobileNavigation = page.getByRole('navigation', { name: 'Navegação móvel' });

    if (isMobile) {
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
