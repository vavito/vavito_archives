import type { PostSummary, TagSummary } from '@web/features/posts';

export interface HomeData {
  popularPosts: PostSummary[];
  publishedPostsCount: number;
  recentPosts: PostSummary[];
  selectedTag: string | null;
  tags: TagSummary[];
}
