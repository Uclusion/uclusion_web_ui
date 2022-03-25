import {
  PUSH_COMMENTS_CHANNEL,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../VersionsContext/versionsContextHelper'
import { overwriteMarketComments, removeMarketsComments, updateCommentsFromVersions } from './commentsContextReducer'
import { pushMessage, registerListener } from '../../utils/MessageBusUtils'
import { fixupItemsForStorage } from '../ContextUtils'
import { addContents } from '../DiffContext/diffContextReducer'
import {
  INDEX_COMMENT_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages'

export const COMMENT_LOAD_EVENT = 'LoadEvent';

function beginListening(dispatch, diffDispatch) {
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
    const fixedUp = fixupItemsForStorage(comments);
    const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_COMMENT_TYPE, items: fixedUp };
    pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
    switch (event) {
      case VERSIONS_EVENT:
        const fixedUpForDiff = fixedUp.map((comment) => {
          const { id, body: description, updated_by,  updated_by_you } = comment;
          return { id, description, updated_by, updated_by_you };
        });
        diffDispatch(addContents(fixedUpForDiff));
        dispatch(updateCommentsFromVersions(marketId, fixedUp));
        break;
      case COMMENT_LOAD_EVENT:
        dispatch(overwriteMarketComments(marketId, fixedUp));
        break;
      default:
        // console.debug(`Ignoring push event ${event}`);
    }
  });
}

export default beginListening;
