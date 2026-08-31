export const SITE_AUTHOR = 'João Victor';
export const SITE_DESCRIPTION =
  'Artigos sobre desenvolvimento de software, arquitetura, produto e os aprendizados por trás de cada projeto.';
export const SITE_LANGUAGE = 'pt-BR';
export const SITE_LOCALE = 'pt_BR';
export const SITE_NAME = 'Vavito Archives';
export const SITE_URL = new URL('https://vavitoarchives.com.br');

export function absoluteSiteUrl(pathname = '/'): string {
  return new URL(pathname, SITE_URL).toString();
}
