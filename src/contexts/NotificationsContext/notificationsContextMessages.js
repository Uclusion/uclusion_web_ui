import {
  addMessage, dehighlightMessages, makeCurrentMessage, removeCurrentMessage,
  removeMessage,
  removeMessages,
  removeMessagesForInvestible,
  updateMessages
} from './notificationsContextReducer'
import { registerListener } from '../../utils/MessageBusUtils'
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../../api/versionedFetchUtils'
import { getMessages } from '../../api/sso'

export const ADD_EVENT = 'add_event';
export const DELETE_EVENT = 'delete_event';
export const DEHIGHLIGHT_EVENT = 'dehighlight_event';
export const MODIFY_NOTIFICATIONS_CHANNEL = 'delete_notifications';
export const STAGE_CHANGE_EVENT = 'stage_change_event';
export const REMOVE_EVENT = 'remove_event';
export const CURRENT_EVENT = 'current_event';
export const REMOVE_CURRENT_EVENT = 'remove_current_event';

function beginListening(dispatch) {
  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event, message } } = data;
    // // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case VERSIONS_EVENT:
        getMessages().then((messages) => {
          dispatch(updateMessages(messages));
        });
        break;
      case ADD_EVENT:
        dispatch(addMessage(message));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(MODIFY_NOTIFICATIONS_CHANNEL, 'notificationsDelete', (data) => {
    const { payload: { event, investibleId, useRemoveTypes, message, messages } } = data;
    switch (event) {
      case DELETE_EVENT:
        dispatch(removeMessages(message));
        break;
      case DEHIGHLIGHT_EVENT:
        dispatch(dehighlightMessages(messages));
        break;
      case STAGE_CHANGE_EVENT:
        dispatch(removeMessagesForInvestible(investibleId, useRemoveTypes));
        break;
      case REMOVE_EVENT:
        dispatch(removeMessage(message));
        break;
      case CURRENT_EVENT:
        dispatch(makeCurrentMessage(message));
        break;
      case REMOVE_CURRENT_EVENT:
        dispatch(removeCurrentMessage());
        break;
      default:
      // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
