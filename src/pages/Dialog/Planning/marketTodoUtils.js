import { TODO_TYPE } from '../../../constants/comments';

export function isTodoRoot(comment) {
  return comment.comment_type === TODO_TYPE && !comment.reply_id;
}

export function getResolvedTodoThreadComments(comments, groupId) {
  const roots = (comments || []).filter((comment) => !comment.investible_id &&
    comment.resolved && comment.group_id === groupId && isTodoRoot(comment));
  const rootIds = new Set(roots.map((comment) => comment.id));
  const descendants = (comments || []).filter((comment) =>
    rootIds.has(comment.root_comment_id) && comment.id !== comment.root_comment_id);
  return roots.concat(descendants);
}
