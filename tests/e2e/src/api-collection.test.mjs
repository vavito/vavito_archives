import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const collectionUrl = new URL(
  '../../../docs/development/postman/vavito-archives.postman_collection.json',
  import.meta.url,
);
const environmentUrl = new URL(
  '../../../docs/development/postman/vavito-archives.postman_environment.json',
  import.meta.url,
);
const openApiUrl = new URL('../../../packages/api-client/openapi/openapi.json', import.meta.url);

function requests(items) {
  return items.flatMap((item) => (item.request ? [item] : requests(item.item ?? [])));
}

function scripts(items) {
  return items.flatMap((item) => [
    ...(item.event ?? []).flatMap((event) => event.script?.exec ?? []),
    ...scripts(item.item ?? []),
  ]);
}

test('a coleção Postman mantém um fluxo demonstrável sem credenciais', async () => {
  const [collectionSource, environmentSource, openApiSource] = await Promise.all([
    readFile(collectionUrl, 'utf8'),
    readFile(environmentUrl, 'utf8'),
    readFile(openApiUrl, 'utf8'),
  ]);
  const collection = JSON.parse(collectionSource);
  const environment = JSON.parse(environmentSource);
  const openApi = JSON.parse(openApiSource);
  const documentedRequests = requests(collection.item);
  const folderNames = collection.item.map(({ name }) => name);

  assert.equal(
    collection.info.schema,
    'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  );
  assert.deepEqual(folderNames, [
    '00 - Sistema',
    '01 - Autenticação',
    '02 - Conteúdo público',
    '03 - Fluxo editorial',
    '04 - Engajamento autenticado',
    '05 - Comunicação',
    '06 - Campanha opcional',
  ]);
  assert.equal(documentedRequests.length, 22);

  for (const { request } of documentedRequests) {
    assert.match(request.url, /^\{\{(?:baseUrl|supabaseUrl)\}\}/u);

    if (!request.url.startsWith('{{baseUrl}}')) continue;
    const path = request.url
      .replace('{{baseUrl}}', '')
      .split('?')[0]
      .replace('{{postId}}', '{id}')
      .replace('{{postSlug}}', '{slug}')
      .replace('{{campaignId}}', '{id}');
    assert.ok(openApi.paths[path]?.[request.method.toLowerCase()], `${request.method} ${path}`);
  }

  const capturedVariables = scripts(collection.item).join('\n');
  for (const variable of ['accessToken', 'postId', 'postSlug', 'commentId', 'campaignId']) {
    assert.match(capturedVariables, new RegExp(`collectionVariables\\.set\\('${variable}'`, 'u'));
  }

  const environmentValues = new Map(environment.values.map(({ key, value }) => [key, value]));
  assert.equal(environmentValues.get('supabasePublishableKey'), '');
  assert.equal(environmentValues.get('adminEmail'), '');
  assert.equal(environmentValues.get('adminPassword'), '');

  const serializedArtifacts = `${collectionSource}\n${environmentSource}`;
  assert.doesNotMatch(serializedArtifacts, /postgresql:\/\//iu);
  assert.doesNotMatch(serializedArtifacts, /whsec_[a-z0-9]/iu);
  assert.doesNotMatch(serializedArtifacts, /re_[a-z0-9]{10,}/iu);
});
