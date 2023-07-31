import { createGroup } from '../../../api/markets';
import { addGroupToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { modifyGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';

/**
 * Creates the group from the formdata and does all the magic to make the wizard up date appropriately.
 * @param dispatchers
 * @param formData
 */
export function doCreateGroup(dispatchers, formData) {
  const { marketId, name } = formData;
  const {
    groupsDispatch,
    groupMembersDispatch
  } = dispatchers;

  const groupInfo = {
    name
  };

  return createGroup(marketId, groupInfo)
    .then((response) => {
      const { group, members } = response;
      addGroupToStorage(groupsDispatch, marketId, group);
      groupMembersDispatch(modifyGroupMembers(group.id, members));
      return group;
    });
}