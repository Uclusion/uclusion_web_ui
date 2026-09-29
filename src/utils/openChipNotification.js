import { useContext } from 'react';
import _ from 'lodash';
import { useHistory, useLocation } from 'react-router';
import { NotificationsContext } from '../contexts/NotificationsContext/NotificationsContext';
import { dehighlightMessage } from '../contexts/NotificationsContext/notificationsContextHelper';
import { CommentsContext } from '../contexts/CommentsContext/CommentsContext';
import { MarketsContext } from '../contexts/MarketsContext/MarketsContext';
import { MarketGroupsContext } from '../contexts/MarketGroupsContext/MarketGroupsContext';
import { findMessagesForCommentIds } from './messageUtils';
import { formCommentLink, formInboxItemLink, navigate } from './marketIdPathFunctions';
import { getNotificationDestination, pickNextMessageInSet } from './notificationNavigation';

export function useOpenChipNotification() {
  const history = useHistory();
  const location = useLocation();
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  return (messages) => {
    const resource = `${location.pathname}${location.search}${location.hash}`;
    const message = pickNextMessageInSet(messages, groupsState, commentsState, marketsState,
      location.state?.notification?.id, resource);
    if (!message) {
      return;
    }
    const destination = getNotificationDestination(message, commentsState, marketsState);
    dehighlightMessage(message, messagesDispatch);
    navigate(history, destination?.url || formInboxItemLink(message), false, false,
      destination?.notification ? { notification: destination.notification } : undefined);
  };
}

export function openCriticalBug(history, bug) {
  if (!bug) {
    return;
  }
  navigate(history, formCommentLink(bug.market_id, bug.group_id, bug.investible_id, bug.id));
}

// Same order as the Immediate bug list: most new notifications first, then newest update.
export function firstDisplayedCriticalBug(bugs, messages) {
  return _.orderBy(bugs || [], [
    (comment) => _.size(findMessagesForCommentIds([comment.id], messages, true)),
    'updated_at',
  ], ['desc', 'desc'])[0];
}
