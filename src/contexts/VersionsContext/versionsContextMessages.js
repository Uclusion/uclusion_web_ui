import { Hub } from '@aws-amplify/core';
import {
  AUTH_HUB_CHANNEL,
  MARKET_MESSAGE_EVENT,
  NOTIFICATION_MESSAGE_EVENT, SOCKET_OPEN_EVENT,
  VERSIONS_HUB_CHANNEL,
} from '../WebSocketContext';
import { getVersions } from '../../api/summaries';
import {
  EMPTY_STATE,
  initializeState, initializeVersionsAction,
  refreshMarketVersionAction,
  refreshNotificationVersionAction, refreshVersionsAction,
  removeMarketVersionAction,
} from './versionsContextReducer';

function beginListening(dispatch) {
  Hub.listen(AUTH_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Versions context responding to auth event ${event}`);

    switch (event) {
      case 'signIn': {
        // An optimization would be to check if newly signed is same person
        getVersions().then((versions) => {
          dispatch(initializeVersionsAction(EMPTY_STATE, versions));
        });
        break;
      }
      case 'signOut':
        dispatch(initializeState());
        break;
      default:
        console.debug(`Ignoring auth event ${event}`);
    }
  });

  Hub.listen(VERSIONS_HUB_CHANNEL, (data) => {
    const { payload: { event, message } } = data;
    console.debug(`Versions context responding to push event ${event}`);
    console.debug(message);
    switch (event) {
      case MARKET_MESSAGE_EVENT: {
        const { version, object_id: marketId } = message;
        if (version < 0) {
          dispatch(removeMarketVersionAction(marketId));
        } else {
          const cloneMessage = { ...message };
          delete cloneMessage.object_id;
          dispatch(refreshMarketVersionAction({ marketId, ...cloneMessage }));
        }
        break;
      }
      case NOTIFICATION_MESSAGE_EVENT: {
        dispatch(refreshNotificationVersionAction(message));
        break;
      }
      case SOCKET_OPEN_EVENT: {
        getVersions().then((versions) => {
          dispatch(refreshVersionsAction(versions));
        });
        break;
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
