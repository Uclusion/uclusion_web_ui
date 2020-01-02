import { refreshMarketPresence } from './marketPresencesHelper';
import {
  PUSH_PRESENCE_CHANNEL, REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper';
import { removeMarketsPresence, initializeState } from './marketPresencesContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import { registerListener } from '../../utils/MessageBusUtils';
import { EMPTY_STATE } from './MarketPresencesContext';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';

function beginListening(dispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'marketPresenceRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(removeMarketsPresence(message));
        break;
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_PRESENCE_CHANNEL, 'marketPresencePushStart', (data) => {
    const { payload: { event, message } } = data;

    switch (event) {
      case VERSIONS_EVENT: {
        return AllSequentialMap(message, (marketId) => refreshMarketPresence(dispatch, marketId));
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(AUTH_HUB_CHANNEL, 'marketPresencesHubStart', (data) => {
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

