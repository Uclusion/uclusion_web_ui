import { fixupItemForStorage } from '../ContextUtils'
import { addContents } from '../DiffContext/diffContextReducer'
import { pushMessage } from '../../utils/MessageBusUtils'
import { INDEX_GROUP_TYPE, INDEX_UPDATE, SEARCH_INDEX_CHANNEL } from '../SearchIndexContext/searchIndexContextMessages'
import { updateMarketGroups, updateMarketGroupsFromNetwork } from './marketGroupsContextReducer'
import _ from 'lodash'

export function getGroup(state, marketId, groupId) {
  const groupsSafe  = state || {};
  if (!marketId) {
    let group = undefined;
    Object.keys(groupsSafe).forEach((marketId) => {
      const foundGroup = groupsSafe[marketId].find((group) => group.id === groupId);
      if (foundGroup) {
        group = foundGroup;
      }
    });
    return group;
  }
  const usedGroups = groupsSafe[marketId] || [];
  return usedGroups.find((group) => group.id === groupId);
}

export function pushIndexItems(diskState) {
  const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_GROUP_TYPE, items: _.flatten(Object.values(diskState)) };
  pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
}

export function addGroupToStorage(dispatch, marketId, groupDetails) {
  const fixed = fixupItemForStorage(groupDetails);
  pushMessage(SEARCH_INDEX_CHANNEL, { event: INDEX_UPDATE, itemType: INDEX_GROUP_TYPE, items: [fixed]});
  dispatch(updateMarketGroups(marketId, [fixed]));
}

export function addGroupsToStorage(dispatch, diffDispatch, groupDetails) {
  if (diffDispatch) {
    diffDispatch(addContents([groupDetails]));
  }
  pushIndexItems(groupDetails);
  dispatch(updateMarketGroupsFromNetwork(groupDetails));
}