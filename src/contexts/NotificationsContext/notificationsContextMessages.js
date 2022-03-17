import {
  addMessage, dehighlightMessages, makeCurrentMessage,
  removeMessage,
  removeMessages,
  removeMessagesForInvestible,
  updateMessages
} from './notificationsContextReducer'
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'
import { registerListener } from '../../utils/MessageBusUtils'

export const ADD_EVENT = 'add_event';
export const DELETE_EVENT = 'delete_event';
export const DEHIGHLIGHT_EVENT = 'dehighlight_event';
export const MODIFY_NOTIFICATIONS_CHANNEL = 'delete_notifications';
export const STAGE_CHANGE_EVENT = 'stage_change_event';
export const REMOVE_EVENT = 'remove_event';
export const CURRENT_EVENT = 'current_event';

function beginListening(dispatch) {
  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event, messages, message } } = data;
    // // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(updateMessages(messages));
        break;
      case ADD_EVENT:
        dispatch(addMessage(message));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(MODIFY_NOTIFICATIONS_CHANNEL, 'notificationsDelete', (data) => {
    const { payload: { event, investibleId, useRemoveTypes, message } } = data;
    switch (event) {
      case DELETE_EVENT:
          dispatch(removeMessages(message));
        break;
      case DEHIGHLIGHT_EVENT:
          dispatch(dehighlightMessages(message));
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
      default:
      // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
