

// Make it easy to find where this is used and change if necessary
import { fixupItemForStorage } from '../ContextUtils'
import { addContents } from '../DiffContext/diffContextReducer'
import { pushMessage } from '../../utils/MessageBusUtils'
import { INDEX_MARKET_TYPE, INDEX_UPDATE, SEARCH_INDEX_CHANNEL } from '../SearchIndexContext/searchIndexContextMessages'
import { updateMarketDetails } from '../MarketsContext/marketsContextReducer'

export function isEveryoneGroup(groupId, marketId) {
  return groupId === marketId;
}

//TODO fix this to groups
export function addMarketToStorage(dispatch, diffDispatch, marketDetails) {
  if (!marketDetails.currentUserId) {
    marketDetails.currentUserId = marketDetails.current_user_id;
  }
  const fixed = fixupItemForStorage(marketDetails);
  if (diffDispatch) {
    diffDispatch(addContents([fixed]));
  }
  pushMessage(SEARCH_INDEX_CHANNEL, { event: INDEX_UPDATE, itemType: INDEX_MARKET_TYPE, items: [fixed]});
  dispatch(updateMarketDetails(fixed));
}
