import { searchPublishedPosts } from '@web/features/posts';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length > 200)
    return Response.json({ message: 'Use até 200 caracteres na busca.' }, { status: 400 });
  try {
    const posts = await searchPublishedPosts({ query, signal: request.signal });
    return Response.json(posts, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { message: 'Não conseguimos buscar os artigos agora. Tente novamente.' },
      { status: 503 },
    );
  }
}
