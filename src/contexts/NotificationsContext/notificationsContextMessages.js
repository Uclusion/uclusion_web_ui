import {
  addMessage, dehighlightMessages,
  removeMessages,
  removeMessagesForInvestible,
  updateMessages
} from './notificationsContextReducer'
import { pushMessage, registerListener } from '../../utils/MessageBusUtils';
import {
  LOGIN_EVENT,
  NOTIFICATIONS_HUB_CHANNEL,
  NOTIFICATIONS_HUB_CONTROL_PLANE_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';
import { getMessages } from '../../api/sso'

export const ADD_EVENT = 'add_event';
export const DELETE_EVENT = 'delete_event';
export const DEHIGHLIGHT_EVENT = 'dehighlight_event';
export const MODIFY_NOTIFICATIONS_CHANNEL = 'delete_notifications';
export const STAGE_CHANGE_EVENT = 'stage_change_event';

export const LOGIN_LOADED_EVENT = 'login_loaded_event';


function beginListening(dispatch) {
  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event, message, messages } } = data;
    // // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case LOGIN_EVENT:
        dispatch(updateMessages(messages));
        pushMessage(NOTIFICATIONS_HUB_CONTROL_PLANE_CHANNEL, {event: LOGIN_LOADED_EVENT});
        break;
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
        if (messages === undefined) {
          dispatch(removeMessages([message]));
        } else {
          dispatch(removeMessages(messages));
        }
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
