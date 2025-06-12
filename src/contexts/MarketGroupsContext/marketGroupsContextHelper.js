import { fixupItemForStorage } from '../ContextUtils'
import { updateMarketGroups, updateMarketGroupsFromNetwork } from './marketGroupsContextReducer'

export function getGroup(state, marketId, groupId) {
  const groupsSafe  = state || {};
  if (!marketId) {
    let group = undefined;
    Object.keys(groupsSafe).forEach((marketId) => {
      if (groupsSafe[marketId].find) {
        const foundGroup = groupsSafe[marketId].find((group) => group.id === groupId);
        if (foundGroup) {
          group = foundGroup;
        }
      } else {
        console.error(`Incorrect structure for group state and ${marketId}`);
        console.error(groupsSafe[marketId]);
      }
    });
    return group;
  }
  const usedGroups = groupsSafe[marketId] || [];
  return usedGroups.find((group) => group.id === groupId);
}

export function addGroupToStorage(dispatch, marketId, groupDetails) {
  const fixed = fixupItemForStorage(groupDetails);
  dispatch(updateMarketGroups(marketId, [fixed]));
}

export function addGroupsToStorage(dispatch, groupDetails) {
  dispatch(updateMarketGroupsFromNetwork(groupDetails));
}