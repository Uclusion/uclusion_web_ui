import { Hub } from '@aws-amplify/core';
import { getMessages } from '../../api/sso';
import { updateMessages, updatePage } from './notificationsContextReducer';
import { VIEW_EVENT, VISIT_CHANNEL } from './NotificationsContext';
import { NOTIFICATIONS_HUB_CHANNEL, VERSIONS_EVENT } from '../VersionsContext/versionsContextHelper';

function beginListening(dispatch) {
  Hub.listen(NOTIFICATIONS_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Notifications context responding to push event ${event}`);

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

  Hub.listen(VISIT_CHANNEL, (data) => {
    const { payload: { event, message } } = data;
    console.debug(message);
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
}

export default beginListening;
