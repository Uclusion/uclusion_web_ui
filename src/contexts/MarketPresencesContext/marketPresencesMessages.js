import {
  PUSH_PRESENCE_CHANNEL, REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper';
import { removeMarketsPresence, initializeState, updateMarketPresences } from './marketPresencesContextReducer';
import { registerListener } from '../../utils/MessageBusUtils';
import { EMPTY_STATE } from './MarketPresencesContext';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { getUclusionLocalStorageItem } from '../../components/utils';

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
    const { payload: { event, marketId, users } } = data;

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(updateMarketPresences(marketId, users));
        break;
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(AUTH_HUB_CHANNEL, 'marketPresencesHubStart', (data) => {
    const { payload: { event, data: { username } } } = data;
    switch (event) {
      case 'signIn':
        const oldUserName = getUclusionLocalStorageItem('userName');
        if (oldUserName !== username) {
          dispatch(initializeState(EMPTY_STATE));
        }
        break;
      case 'signOut':
        dispatch(initializeState(EMPTY_STATE));
        break;
      default:
        console.debug(`Ignoring event ${event}`);
    }
  });
}

export default beginListening;

