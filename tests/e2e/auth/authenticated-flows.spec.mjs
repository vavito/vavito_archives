import { expect, test } from '@playwright/test';

const fixtureUrl = 'http://127.0.0.1:4101';
const articlePath = '/artigos/arquitetura-nestjs';

async function newReader(request) {
  const response = await request.post(`${fixtureUrl}/__test/users`);
  expect(response.status()).toBe(201);
  return response.json();
}

async function login(page, reader, next = '/perfil') {
  await page.goto(`/auth?next=${encodeURIComponent(next)}`);
  await page.getByLabel('E-mail', { exact: true }).fill(reader.email);
  await page.getByLabel('Senha', { exact: true }).fill(reader.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${next}$`, 'u'));
}

test('login, atualização de perfil e logout acessível também no mobile', async ({
  page,
  request,
  isMobile,
}) => {
  const reader = await newReader(request);
  await login(page, reader);
  await page.getByLabel('Nome', { exact: true }).fill('Leitor atualizado');
  await page.getByRole('button', { name: 'Salvar nome' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Seu nome foi atualizado.' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Leitor atualizado');
  const profileLogout = page
    .getByRole('main')
    .getByRole('button', { name: 'Fazer Logout', exact: true });
  if (isMobile) {
    await expect(profileLogout).toBeVisible();
    await profileLogout.click();
  } else {
    await expect(profileLogout).toBeHidden();
    await page
      .getByRole('banner')
      .getByRole('button', { name: /Leitor atualizado/u })
      .click();
    await page.getByRole('menuitem', { name: 'Fazer Logout' }).click();
  }
  await expect(page).toHaveURL('http://127.0.0.1:3101/');
  await page.goto('/perfil');
  await expect(page).toHaveURL(/\/auth\?/u);
  await expect(page.getByRole('heading', { name: 'Que bom ter você aqui' })).toBeVisible();
});

test('comentário, edição e reação persistem após recarregar o artigo', async ({
  page,
  request,
}) => {
  const reader = await newReader(request);
  await page.addInitScript(() =>
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: undefined,
      configurable: true,
    }),
  );
  await login(page, reader, articlePath);
  const content = `Comentário de teste ${reader.id}`;
  await page.getByLabel('Deixe seu comentário').fill(content);
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');
  await page.getByRole('button', { name: 'Comentar', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Comentário publicado.' })).toBeVisible();
  await expect(page.getByRole('paragraph').filter({ hasText: content })).toBeVisible();
  await page.getByRole('button', { name: 'Editar', exact: true }).click();
  await page.getByLabel('Editar comentário').fill(`${content} revisado`);
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(
    page.getByRole('paragraph').filter({ hasText: `${content} revisado` }),
  ).toBeVisible();
  const like = page.getByRole('button', { name: /^Gostei,/u });
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toBeEnabled();
  await page.reload();
  await expect(
    page.getByRole('paragraph').filter({ hasText: `${content} revisado` }),
  ).toBeVisible();
  await expect(page.getByText('editado', { exact: true }).first()).toBeVisible();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await expect(like).toBeEnabled();
  await page.getByRole('button', { name: 'Excluir', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(page.getByRole('paragraph').filter({ hasText: `${content} revisado` })).toHaveCount(
    0,
  );
});

test('comentário e resposta crescem com limite, quebram palavras e não alargam a página', async ({
  page,
  request,
}) => {
  const reader = await newReader(request);
  await login(page, reader, articlePath);
  const input = page.getByLabel('Deixe seu comentário');
  const initial = await input.evaluate((el) => el.offsetHeight);
  await input.fill('Texto curto');
  expect(await input.evaluate((el) => el.offsetHeight)).toBe(initial);
  for (let length = 8; length <= 512; length += 8) {
    await input.fill('x'.repeat(length));
    const size = await input.evaluate((el) => ({
      height: el.offsetHeight,
      line: parseFloat(globalThis.getComputedStyle(el).lineHeight),
      fits: el.scrollHeight <= el.clientHeight + 1,
    }));
    expect(size.fits).toBe(true);
    if (size.height > initial) {
      expect(size.height - initial).toBeLessThanOrEqual(size.line + 1);
      await input.press('End');
      await input.press('x');
      expect(await input.evaluate((el) => el.offsetHeight)).toBe(size.height);
      break;
    }
    expect(length).toBeLessThan(512);
  }
  await input.fill('x'.repeat(1000));
  const grown = await input.evaluate((el) => el.offsetHeight);
  expect(grown).toBeGreaterThan(initial);
  expect(
    await input.evaluate((el) => el.scrollHeight <= el.clientHeight + 1 || el.offsetHeight === 640),
  ).toBe(true);
  const content = 'x'.repeat(1900);
  await input.fill(content);
  const capped = await input.evaluate((el) => el.offsetHeight);
  expect(capped).toBeLessThanOrEqual(grown + 1);
  expect(await input.evaluate((el) => globalThis.getComputedStyle(el).resize)).toBe('none');
  await page.getByRole('button', { name: 'Comentar', exact: true }).click();
  const published = page.getByRole('paragraph').filter({ hasText: content });
  await expect(published).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Comentário publicado.' })).toBeVisible();
  const card = published.locator('xpath=ancestor::article[1]');
  await card.getByRole('button', { name: 'Responder', exact: true }).click();
  const reply = card.getByRole('textbox');
  const replyInitial = await reply.evaluate((el) => el.offsetHeight);
  await reply.fill('Resposta curta');
  expect(await reply.evaluate((el) => el.offsetHeight)).toBe(replyInitial);
  await reply.fill('y'.repeat(1000));
  const replyGrown = await reply.evaluate((el) => el.offsetHeight);
  expect(replyGrown).toBeGreaterThan(replyInitial);
  expect(
    await reply.evaluate((el) => el.scrollHeight <= el.clientHeight + 1 || el.offsetHeight === 640),
  ).toBe(true);
  const replyContent = 'y'.repeat(1900);
  await reply.fill(replyContent);
  expect(await reply.evaluate((el) => el.offsetHeight)).toBeLessThanOrEqual(replyGrown + 1);
  expect(
    await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    ),
  ).toBe(true);
  await card.getByRole('button', { name: 'Responder', exact: true }).last().click();
  await expect(card.getByRole('paragraph').filter({ hasText: replyContent })).toBeVisible();
  expect(
    await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth <= globalThis.innerWidth,
    ),
  ).toBe(true);
  await card.getByRole('button', { name: 'Excluir', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir', exact: true }).click();
});

test('visitante recebe orientação para entrar ao salvar ou reagir', async ({ page }) => {
  await page.goto(articlePath);
  await page.getByRole('button', { name: 'Salvar artigo', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('link').first()).toHaveAttribute('href', /auth/u);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^Gostei,/u }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('salvos são privados, persistem e podem ser desfeitos', async ({ page, request, browser }) => {
  const reader = await newReader(request);
  await login(page, reader, articlePath);
  await page.getByRole('button', { name: 'Salvar artigo', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remover dos salvos', exact: true })).toBeEnabled();
  await page.goto('/salvos');
  await expect(page.getByRole('heading', { name: 'Arquitetura NestJS' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Arquitetura NestJS' })).toBeVisible();
  const otherContext = await browser.newContext();
  try {
    const other = await otherContext.newPage();
    const otherReader = await newReader(request);
    // A separate context has no cookies from the first account.
    await other.goto('http://127.0.0.1:3101/auth?next=/salvos');
    await other.getByLabel('E-mail', { exact: true }).fill(otherReader.email);
    await other.getByLabel('Senha', { exact: true }).fill(otherReader.password);
    await other.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(other.getByText('Você ainda não salvou nenhum artigo.')).toBeVisible();
  } finally {
    await otherContext.close();
  }
  await page.getByRole('button', { name: 'Remover dos salvos', exact: true }).click();
  await expect(page.getByText('Você ainda não salvou nenhum artigo.')).toBeVisible();
});

test('senha nova revoga a renovação de todas as sessões, inclusive de outro dispositivo', async ({
  page,
  request,
}) => {
  const reader = await newReader(request);
  const otherLogin = await request.post(`${fixtureUrl}/auth/v1/token?grant_type=password`, {
    data: reader,
  });
  const otherSession = await otherLogin.json();
  await login(page, reader);
  await page.goto('/auth/reset-password');
  await page.getByLabel('Nova senha', { exact: true }).fill('Nova@Senha456');
  await page.getByLabel('Confirme a nova senha', { exact: true }).fill('Nova@Senha456');
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click();
  await expect(page).toHaveURL(/auth_status=password_updated/u);
  const refresh = await request.post(`${fixtureUrl}/auth/v1/token?grant_type=refresh_token`, {
    data: { refresh_token: otherSession.refresh_token },
  });
  expect(refresh.status()).toBe(400);
  const previousPassword = await request.post(`${fixtureUrl}/auth/v1/token?grant_type=password`, {
    data: reader,
  });
  expect(previousPassword.status()).toBe(400);
  await login(page, { ...reader, password: 'Nova@Senha456' });
});

test('senha alterada com logout falho permite repetir somente o encerramento', async ({
  page,
  request,
}) => {
  const reader = await newReader(request);
  await login(page, reader);
  await request.post(`${fixtureUrl}/__test/fail-logout/${reader.id}`);
  await page.goto('/auth/reset-password');
  await page.getByLabel('Nova senha', { exact: true }).fill('Nova@Senha456');
  await page.getByLabel('Confirme a nova senha', { exact: true }).fill('Nova@Senha456');
  await page.getByRole('button', { name: 'Alterar senha', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Sua senha foi alterada' })).toBeVisible();
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Encerrar sessões', exact: true }).click();
  await expect(page).toHaveURL(/auth_status=password_updated/u);
});
