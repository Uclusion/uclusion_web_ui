import {
  PUSH_COMMENTS_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper'
import { removeMarketsComments, updateCommentsFromVersions } from './commentsContextReducer'
import { registerListener } from '../../utils/MessageBusUtils'
import { fixupItemsForStorage } from '../ContextUtils'

function beginListening(dispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'commentsRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(removeMarketsComments(message));
        break;
      default:
        // console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_COMMENTS_CHANNEL, 'commentsPushStart', (data) => {
    const { payload: { event, marketId, comments } } = data;

    switch (event) {
      case VERSIONS_EVENT:
        const fixedUp = fixupItemsForStorage(comments);
        dispatch(updateCommentsFromVersions(marketId, fixedUp));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
