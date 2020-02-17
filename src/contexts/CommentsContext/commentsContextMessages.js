import { refreshMarketComments, removeComments } from './commentsContextHelper';
import {
  PUSH_COMMENTS_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper';
import { removeMarketsComments, initializeState } from './commentsContextReducer';
import{ registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { EMPTY_STATE } from './CommentsContext';
import { getUclusionLocalStorageItem } from '../../components/utils';

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
  registerListener(AUTH_HUB_CHANNEL, 'commentsHubStart', (data) => {
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
