import { REPLY_TYPE } from '../../../constants/comments';
import { findMessagesForCommentIds } from '../../../utils/messageUtils';
import { isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper';

export function countAssistanceRootsWithNewMessages(bucketComments, investibleComments, messagesState) {
  const messages = messagesState?.messages || [];
  return (bucketComments || []).filter((rootComment) => {
    const threadIds = [rootComment.id].concat((investibleComments || []).filter((comment) =>
      comment.comment_type === REPLY_TYPE && comment.root_comment_id === rootComment.id).map((comment) => comment.id));
    const hasThreadMessage = findMessagesForCommentIds(threadIds, messagesState, true).some(isInInbox);
    const hasInlineMessage = Boolean(rootComment.inline_market_id) &&
      messages.some((message) => message.is_highlighted &&
        message.market_id === rootComment.inline_market_id && isInInbox(message));
    return hasThreadMessage || hasInlineMessage;
  }).length;
}
