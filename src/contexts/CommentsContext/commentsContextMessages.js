import { refreshMarketComments, removeComments } from './commentsContextHelper';
import {
  PUSH_COMMENTS_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper';
import { removeMarketsComments } from './commentsContextReducer';
import{ registerListener } from '../../utils/MessageBusUtils';

export const REMOVE_COMMENTS = 'REMOVE_COMMENTS';


function beginListening(dispatch) {
  registerListener(REMOVED_MARKETS_CHANNEL, 'commentsRemovedMarketStart', (data) => {
    const { payload: { event, message } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        dispatch(removeMarketsComments(message));
        break;
      default:
        console.debug(`Ignoring identity event ${event}`);
    }
  });
  registerListener(PUSH_COMMENTS_CHANNEL, 'commentsPushStart', (data) => {
    const { payload: { event, marketId, comments } } = data;

    switch (event) {
      case REMOVE_COMMENTS:
        removeComments(dispatch, marketId, comments);
        break;
      case VERSIONS_EVENT:
        refreshMarketComments(dispatch, marketId, comments);
        break;
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
