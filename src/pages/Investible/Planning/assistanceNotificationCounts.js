import { REPLY_TYPE } from '../../../constants/comments';
import { findMessagesForCommentIds } from '../../../utils/messageUtils';
import { isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper';

// J-all-440: takes a message list. Callers pass the synced set so the Debatable tab does not
// advertise a notification whose comment has not arrived.
export function countAssistanceRootsWithNewMessages(bucketComments, investibleComments, messagesIn) {
  const messages = messagesIn || [];
  return (bucketComments || []).filter((rootComment) => {
    const threadIds = [rootComment.id].concat((investibleComments || []).filter((comment) =>
      comment.comment_type === REPLY_TYPE && comment.root_comment_id === rootComment.id).map((comment) => comment.id));
    const hasThreadMessage = findMessagesForCommentIds(threadIds, messages, true).some(isInInbox);
    const hasInlineMessage = Boolean(rootComment.inline_market_id) &&
      messages.some((message) => message.is_highlighted &&
        message.market_id === rootComment.inline_market_id && isInInbox(message));
    return hasThreadMessage || hasInlineMessage;
  }).length;
}

export function assistanceNewMessages(bucketComments, investibleComments, messagesIn) {
  const messages = messagesIn || [];
  const found = [];
  const seen = new Set();
  function add(message) {
    if (message && !seen.has(message.type_object_id)) {
      seen.add(message.type_object_id);
      found.push(message);
    }
  }
  (bucketComments || []).forEach((rootComment) => {
    const threadIds = [rootComment.id].concat((investibleComments || []).filter((comment) =>
      comment.comment_type === REPLY_TYPE && comment.root_comment_id === rootComment.id).map((comment) => comment.id));
    findMessagesForCommentIds(threadIds, messages, true).filter(isInInbox).forEach(add);
    if (rootComment.inline_market_id) {
      messages.filter((message) => message.is_highlighted
        && message.market_id === rootComment.inline_market_id && isInInbox(message)).forEach(add);
    }
  });
  return found;
}
