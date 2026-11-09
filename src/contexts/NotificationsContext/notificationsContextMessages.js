import {
  dehighlightCriticalMessage,
  dehighlightMessages,
  removeMessages,
  removeMessagesForInvestible,
  updateMessages
} from './notificationsContextReducer';
import { registerListener } from '../../utils/MessageBusUtils';
import {
  isRefreshLifecycleCurrent,
  NOTIFICATIONS_HUB_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';
import { getMessages } from '../../api/sso'

export const ADD_EVENT = 'add_event';
export const DELETE_EVENT = 'delete_event';
export const DEHIGHLIGHT_EVENT = 'dehighlight_event';
export const DEHIGHLIGHT_CRITICAL_EVENT = 'dehighlight_critical_event';
export const MODIFY_NOTIFICATIONS_CHANNEL = 'delete_notifications';
export const STAGE_CHANGE_EVENT = 'stage_change_event';


function beginListening(dispatch, setRefreshState) {
  let pendingRefresh;
  function refreshMessages(refreshLifecycle, onlyIfIdle) {
    if (pendingRefresh && pendingRefresh.lifecycle === refreshLifecycle) {
      // An initial read can share the current request. A later version release must get a
      // trailing read: the in-flight response may have captured an older message list.
      pendingRefresh.queued ||= !onlyIfIdle;
      return;
    }
    const request = { lifecycle: refreshLifecycle };
    pendingRefresh = request;
    setRefreshState({ refreshing: true });
    getMessages().then((messages) => {
      if (pendingRefresh !== request || !isRefreshLifecycleCurrent(refreshLifecycle)) {
        return;
      }
      dispatch(updateMessages(messages));
      // Publish each completed snapshot even under continuous traffic. The trailing read
      // keeps the sync indicator active without starving usable messages on a slow link.
      setRefreshState({ refreshed: true, refreshError: false });
    }).catch(() => {
      if (pendingRefresh === request && isRefreshLifecycleCurrent(refreshLifecycle)) {
        setRefreshState({ refreshError: true });
        console.warn('Error getting messages');
      }
    }).finally(() => {
      if (pendingRefresh === request) {
        pendingRefresh = undefined;
        if (request.queued && isRefreshLifecycleCurrent(refreshLifecycle)) {
          refreshMessages(refreshLifecycle);
        } else {
          setRefreshState({ refreshing: false });
        }
      }
    });
  }
  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event, notifications, refreshLifecycle, onlyIfIdle } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        refreshMessages(refreshLifecycle, onlyIfIdle);
        break;
      case ADD_EVENT:
        dispatch(updateMessages(notifications));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(MODIFY_NOTIFICATIONS_CHANNEL, 'notificationsDelete', (data) => {
    const { payload: { event, investibleId, useRemoveTypes, message, originalMessage, messages } } = data;
    switch (event) {
      case DELETE_EVENT:
        if (messages === undefined) {
          dispatch(removeMessages([message]));
        } else {
          dispatch(removeMessages(messages));
        }
        break;
      case DEHIGHLIGHT_CRITICAL_EVENT:
        dispatch(dehighlightCriticalMessage(message, originalMessage))
        break;
      case DEHIGHLIGHT_EVENT:
        if (messages === undefined) {
          dispatch(dehighlightMessages([message]));
        } else {
          dispatch(dehighlightMessages(messages));
        }
        break;
      case STAGE_CHANGE_EVENT:
        dispatch(removeMessagesForInvestible(investibleId, useRemoveTypes));
        break;
      default:
      // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
