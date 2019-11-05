import { Hub } from '@aws-amplify/core';
import {
  AUTH_HUB_CHANNEL,
  MARKET_MESSAGE_EVENT,
  NOTIFICATION_MESSAGE_EVENT,
  VERSIONS_HUB_CHANNEL,
} from '../WebSocketContext';
import { getVersions } from '../../api/summaries';
import {
  initializeState,
  refreshMarketVersionAction,
  refreshNotificationVersionAction,
  refreshVersionsAction,
  removeMarketVersionAction
} from './versionsContextReducer';

function beginListening(dispatch) {
  Hub.listen(AUTH_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Versions context responding to auth event ${event}`);

    switch (event) {
      case 'signIn':
        // An optimization would be to check if newly signed is same person
        dispatch(initializeState());
        getVersions().then((versions) => {
          dispatch(refreshVersionsAction(versions));
        });
        break;
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

    switch (event) {
      case MARKET_MESSAGE_EVENT: {
        const { version, object_id: marketId } = message;
        if (version < 0) {
          dispatch(removeMarketVersionAction(marketId));
        } else {
          delete message.object_id;
          dispatch(refreshMarketVersionAction({ marketId, ...message }));
        }
        break;
      }
      case NOTIFICATION_MESSAGE_EVENT: {
        const { version } = message;
        dispatch(refreshNotificationVersionAction(version));
        break;
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
