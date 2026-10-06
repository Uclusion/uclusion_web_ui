import { useContext, useRef } from 'react';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getInboxTarget, isInInbox } from '../../contexts/NotificationsContext/notificationsContextHelper';
import { dismissWorkListItem, removeWorkListItem } from '../../pages/Home/YourWork/WorkListItem';
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { getNotificationObjectDestination } from '../../utils/notificationNavigation';

export default function useInboxWizardActions(message) {
  const history = useHistory();
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  // Completion callbacks may have been created before notifications arrived or cleared.
  const current = useRef();
  current.current = { messagesState, commentsState, marketsState };

  function returnToInbox(fallbackLink, removedIds = []) {
    const remaining = (current.current.messagesState.messages || []).some((notification) =>
      isInInbox(notification) && !removedIds.includes(notification.type_object_id));
    navigate(history, remaining ? getInboxTarget() : fallbackLink);
  }

  function itemLink() {
    const { commentsState, marketsState } = current.current;
    const targetMessage = message.comment_id ? message :
      { ...message, comment_id: message.comment_list?.[0] };
    const destination = getNotificationObjectDestination(targetMessage, commentsState, marketsState);
    if (destination) return destination.url;
    return message.investible_id ? formInvestibleLink(message.market_id, message.investible_id) :
      formMarketLink(message.market_id, message.group_id);
  }

  function clearNotification() {
    removeWorkListItem(message, messagesDispatch);
    const removedIds = message.type_object_id.startsWith('UNREAD') ? [message.type_object_id] : [];
    returnToInbox(itemLink(), removedIds);
  }

  function dismissNotification() {
    dismissWorkListItem(message, messagesDispatch);
    returnToInbox(itemLink(), [message.type_object_id]);
  }

  return { clearNotification, dismissNotification, returnToInbox };
}
