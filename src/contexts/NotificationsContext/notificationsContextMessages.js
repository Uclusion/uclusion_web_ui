import { addMessage, updateMessages } from './notificationsContextReducer'
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'
import { registerListener } from '../../utils/MessageBusUtils'
import { getMarketClient } from '../../api/uclusionClient'

export const ADD_EVENT = 'add_event';
export const DELETE_EVENT = 'delete_event';
export const DELETE_NOTIFICATIONS_CHANNEL = 'delete_notifications';

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
  registerListener(DELETE_NOTIFICATIONS_CHANNEL, 'notificationsDelete', (data) => {
    const { payload: { event, message } } = data;
    const { market_id: marketId, type_object_id: typeObjectId } = message;
    // // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case DELETE_EVENT:
        getMarketClient(marketId).then((client) => client.users.removeNotifications([typeObjectId]));
        break;
      default:
      // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
