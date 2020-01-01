import { getMessages } from '../../api/sso';
import { updateMessages, updatePage, initializeState } from './notificationsContextReducer';
import { VIEW_EVENT, VISIT_CHANNEL, EMPTY_STATE } from './NotificationsContext';
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper';
import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';

function beginListening(dispatch) {
  registerListener(NOTIFICATIONS_HUB_CHANNEL, 'notificationsStart', (data) => {
    const { payload: { event } } = data;
    // console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case VERSIONS_EVENT:
        getMessages().then((messages) => {
          dispatch(updateMessages(messages));
        });
        break;
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });

  registerListener(VISIT_CHANNEL, 'notificationsVisitStart', (data) => {
    const { payload: { event, message } } = data;
    // console.debug(message);
    switch (event) {
      case VIEW_EVENT: {
        const { marketId, investibleId, isEntry } = message;
        if (isEntry) {
          if (!investibleId) {
            dispatch(updatePage({ marketId }));
          } else {
            dispatch(updatePage({ marketId, investibleId }));
          }
        } else {
          dispatch(updatePage(undefined));
        }
        break;
      }
      default:
        console.debug(`Ignoring event ${event}`);
    }
  });
  registerListener(AUTH_HUB_CHANNEL, 'notificationsHubStart', (data) => {
    const { payload: { event } } = data;
    switch (event) {
      case 'signIn':
      case 'signOut':
        dispatch(initializeState(EMPTY_STATE));
        break;
      default:
        console.debug(`Ignoring event ${event}`);
    }
  });
}

export default beginListening;
