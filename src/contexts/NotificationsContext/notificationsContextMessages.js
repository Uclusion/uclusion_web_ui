import { addMessage, updateMessages } from './notificationsContextReducer'
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'
import { registerListener } from '../../utils/MessageBusUtils'

export const ADD_EVENT = 'add_event';

function beginListening(dispatch, history) {
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
}

export default beginListening;
