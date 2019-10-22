import { Hub } from '@aws-amplify/core';
import { AUTH_HUB_CHANNEL, MESSAGES_EVENT, NOTIFICATIONS_HUB_CHANNEL } from '../WebSocketContext';
import { getMessages } from '../../api/sso';
import { updateMessages, updatePage } from './notificationsContextReducer';
import { VIEW_EVENT, VISIT_CHANNEL } from './NotificationsContext';

function beginListening(dispatch) {
  Hub.listen(AUTH_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Notifications context responding to auth event ${event}`);

    switch (event) {
      case 'signIn':
        getMessages().then((messages) => {
          dispatch(updateMessages(messages));
        });
        break;
      case 'signOut':
        break;
      default:
        console.debug(`Ignoring auth event ${event}`);
    }
  });

  Hub.listen(NOTIFICATIONS_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Notifications context responding to push event ${event}`);

    switch (event) {
      case MESSAGES_EVENT:
        getMessages().then((messages) => {
          dispatch(updateMessages(messages));
        });
        break;
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });

  Hub.listen(VISIT_CHANNEL, (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VIEW_EVENT: {
        const { marketId, investibleIdOrContext, isEntry } = message;
        console.debug('Received:');
        console.debug(message);
        if (isEntry) {
          if (investibleIdOrContext === 'context') {
            dispatch(updatePage({ marketId }));
          } else {
            dispatch(updatePage({ marketId, investibleId: investibleIdOrContext }));
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
}

export default beginListening;
