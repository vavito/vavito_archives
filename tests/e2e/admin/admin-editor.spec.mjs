import { expect, test } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:4102';

async function loginAsAdmin(page) {
  await page.goto('/auth?next=/admin/posts');
  await page.getByLabel('E-mail', { exact: true }).fill('admin-e2e@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('Admin@E2E123');
  await page.getByRole('button', { exact: true, name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/admin\/posts$/u);
}

test('admin edita, salva, envia capa, revisa o preview e publica um artigo', async ({
  page,
  request,
}) => {
  await loginAsAdmin(page);
  await expect(page.getByRole('heading', { exact: true, name: 'Artigos' })).toBeVisible();
  await page.getByRole('link', { name: 'Novo artigo' }).click();
  await expect(page).toHaveURL(/\/admin\?new=1$/u);

  await page.getByLabel('Título do artigo').fill('Fluxo editorial validado');
  await page
    .getByLabel('Resumo do artigo')
    .fill('Uma publicação criada integralmente pelo teste administrativo.');
  await page.getByLabel('Endereço do artigo').fill('fluxo-editorial-validado');
  await page.getByLabel('Tópicos do artigo').fill('Qualidade');
  await page.getByLabel('Tópicos do artigo').press('Enter');

  const editor = page.getByRole('textbox', { name: 'Conteúdo do artigo' });
  await editor.fill('Conteúdo final do fluxo editorial.');
  await editor.press('Control+A');
  await page.getByRole('button', { name: 'Negrito' }).click();
  await expect(editor.locator('strong')).toHaveText('Conteúdo final do fluxo editorial.');

  await expect(page.getByText('Rascunho salvo', { exact: true })).toBeVisible();
  const previewLink = page.getByRole('link', { name: 'Visualizar artigo' });
  await expect(previewLink).not.toHaveAttribute('aria-disabled', 'true');
  const previewHref = await previewLink.getAttribute('href');
  const postId = previewHref?.match(/\/admin\/posts\/([^/]+)\/preview/u)?.[1];
  expect(postId).toBeTruthy();

  const persistedDraft = await request.get(`${apiUrl}/__test/posts/${postId}`);
  expect(await persistedDraft.json()).toMatchObject({
    excerpt: 'Uma publicação criada integralmente pelo teste administrativo.',
    slug: 'fluxo-editorial-validado',
    tagNames: ['Qualidade'],
    title: 'Fluxo editorial validado',
  });

  await page.getByRole('button', { name: 'Adicionar capa' }).click();
  await page.getByLabel('Arquivo').setInputFiles({
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
    mimeType: 'image/png',
    name: 'capa.png',
  });
  await page.getByLabel('Descrição da imagem').fill('Capa do fluxo editorial');
  await page.getByRole('button', { name: 'Usar como capa' }).click();
  await expect(page.getByRole('img', { name: 'Capa do fluxo editorial' })).toBeVisible();
  await expect(page.getByText('Rascunho salvo', { exact: true })).toBeVisible();

  await previewLink.click();
  await expect(page).toHaveURL(new RegExp(`/admin/posts/${postId}/preview$`, 'u'));
  await expect(page.getByRole('heading', { name: 'Fluxo editorial validado' })).toBeVisible();
  await expect(page.getByText('Conteúdo final do fluxo editorial.')).toBeVisible();
  await expect(page.getByRole('img', { name: 'Capa do fluxo editorial' })).toBeVisible();

  await page.getByRole('link', { name: 'Editar' }).click();
  await expect(page).toHaveURL(new RegExp(`/admin\\?post=${postId}$`, 'u'));
  await expect(page.getByLabel('Título do artigo')).toHaveValue('Fluxo editorial validado');
  await page.getByRole('button', { exact: true, name: 'Publicar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar agora' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Artigo publicado.' })).toBeVisible();

  await page.goto('/admin/posts');
  await expect(page.getByRole('heading', { name: 'Fluxo editorial validado' })).toBeVisible();
  await expect(page.getByText('Publicado', { exact: true })).toBeVisible();
});
