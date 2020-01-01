import { refreshMarketComments } from './commentsContextHelper';
import {
  PUSH_COMMENTS_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper';
import { removeMarketsComments, initializeState } from './commentsContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import{ registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { EMPTY_STATE } from './CommentsContext';

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
    const { payload: { event, message } } = data;

    switch (event) {
      case VERSIONS_EVENT: {
        console.debug(message);
        AllSequentialMap(message, (marketId) => refreshMarketComments(dispatch, marketId));
        break;
      }
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });
  registerListener(AUTH_HUB_CHANNEL, 'commentsHubStart', (data) => {
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
