import { getMessages } from '../../api/sso';
import { updateMessages, updatePage, remove } from './notificationsContextReducer';
import { VIEW_EVENT, VISIT_CHANNEL } from './NotificationsContext';
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper'
import { registerListener } from '../../utils/MessageBusUtils';
import { REMOVE_EVENT } from '../WebSocketContext';

function beginListening(dispatch) {
  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event, hkey, rkey } } = data;
    // // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case VERSIONS_EVENT:
        getMessages().then((messages) => {
          return dispatch(updateMessages(messages));
        });
        break;
      case REMOVE_EVENT:
        dispatch(remove(hkey, rkey));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });

  registerListener(VISIT_CHANNEL, 'notificationsVisitStart', (data) => {
    const { payload: { event, message } } = data;
    // console.debug(message);
    switch (event) {
      case VIEW_EVENT: {
        const { marketId, investibleId, isEntry, action } = message;
        if (isEntry) {
          if (!investibleId) {
            dispatch(updatePage({ marketId, action }));
          } else {
            dispatch(updatePage({ marketId, investibleId, action }));
          }
        } else {
          dispatch(updatePage(undefined));
        }
        break;
      }
      default:
        // console.debug(`Ignoring event ${event}`);
    }
  });
}

export default beginListening;
