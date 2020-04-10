import {
  BANNED_LIST,
  PUSH_PRESENCE_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper'
import { processBannedList, removeMarketsPresence, updateMarketPresences } from './marketPresencesContextReducer'
import { registerListener } from '../../utils/MessageBusUtils'

function beginListening(dispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'marketPresenceRemovedMarketStart', (data) => {
    const { payload: { event, message, bannedList } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(removeMarketsPresence(message));
        break;
      case BANNED_LIST:
        dispatch(processBannedList(bannedList));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_PRESENCE_CHANNEL, 'marketPresencePushStart', (data) => {
    const { payload: { event, marketId, users } } = data;

    switch (event) {
      case VERSIONS_EVENT:
        dispatch(updateMarketPresences(marketId, users));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;

