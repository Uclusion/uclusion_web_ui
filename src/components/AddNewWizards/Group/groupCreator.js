import { createGroup } from '../../../api/markets'
import { addGroupToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'
import { versionsUpdateGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer'

/**
 * Creates the group from the formdata and does all the magic to make the wizard up date appropriately.
 * @param dispatchers
 * @param formData
 */
export function doCreateGroup(dispatchers, formData) {
  const { marketId, name, votesRequired, investmentExpiration } = formData;
  const {
    groupsDispatch,
    groupMembersDispatch
  } = dispatchers;

  const groupInfo = {
    name
  };

  if (votesRequired > 0) {
    groupInfo.votes_required = formData.votesRequired
  }
  if (investmentExpiration != null) {
    groupInfo.investment_expiration = investmentExpiration
  }

  return createGroup(marketId, groupInfo)
    .then((response) => {
      const { group, members } = response;
      addGroupToStorage(groupsDispatch, marketId, group);
      groupMembersDispatch(versionsUpdateGroupMembers(members));
      return group;
    });
}