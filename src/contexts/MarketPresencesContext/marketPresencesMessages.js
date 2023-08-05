import {
  processBanned,
  removeMarketsPresence,
  versionsUpdateMarketPresences
} from './marketPresencesContextReducer'
import { registerListener } from '../../utils/MessageBusUtils'
import { addPresenceToMarket } from './marketPresencesHelper'
import {
  BANNED_LIST, DEMO_EVENT,
  PUSH_PRESENCE_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../../api/versionedFetchUtils';

export const ADD_PRESENCE = 'AddPresence';

function beginListening(dispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'marketPresenceRemovedMarketStart', (data) => {
    const { payload: { event, message, fullList } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(removeMarketsPresence(message));
        break;
      case BANNED_LIST:
        dispatch(processBanned(fullList));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_PRESENCE_CHANNEL, 'marketPresencePushStart', (data) => {
    const { payload: { event, marketId, userDetails, presence } } = data;

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(versionsUpdateMarketPresences(userDetails));
        break;
      case DEMO_EVENT:
        console.info('Responding to demo presences event');
      // eslint-disable-next-line no-fallthrough
      case ADD_PRESENCE:
        addPresenceToMarket(dispatch, marketId, presence);
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;

