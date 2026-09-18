import type { PostSummary } from '../types/posts.types';
import { RelatedPostsList } from './related-posts-list';

export function RelatedPostsSection({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="related-posts-title"
      className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-16 lg:pb-24"
    >
      <div className="grid gap-2">
        <h2 className="text-neutral-100 text-2xl font-semibold" id="related-posts-title">
          Artigos relacionados
        </h2>
        <p className="text-neutral-500 text-sm">Continue explorando o mesmo tópico.</p>
      </div>
      <RelatedPostsList posts={posts} />
    </section>
  );
}
