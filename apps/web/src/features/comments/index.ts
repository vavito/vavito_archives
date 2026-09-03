export { CommentsSection } from './components/comments-section';
export { COMMENT_LIMITS, validateCommentContent } from './schemas/comment.schema';
export { getCommentsPage } from './services/comments-api.service';
export type {
  CommentActionResult,
  CommentAuthor,
  CommentItem,
  CommentsPageData,
  CommentViewer,
} from './types/comments.types';
