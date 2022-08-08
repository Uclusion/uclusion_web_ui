import { createGroup } from '../../../api/markets'
import _ from 'lodash';
import { addGroupToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'

/**
 * Creates the group from the formdata and does all the magic to make the wizard up date appropriately.
 * @param dispatchers
 * @param formData
 * @param updateFormData
 */
export function doCreateGroup(dispatchers, formData, updateFormData) {
  const { name, votesRequired, ticketSubCode, assignedCanApprove, isBudgetAvailable, budgetUnit } = formData;
  const {
    groupsDispatch,
    diffDispatch,
    groupMembersDispatch
  } = dispatchers;

  const groupInfo = {
    name
  };

  if (votesRequired > 0) {
    groupInfo.votes_required = formData.votesRequired
  }
  if (!_.isEmpty(ticketSubCode)) {
    groupInfo.ticket_sub_code = formData.ticketSubCode
  }
  if (assignedCanApprove === 'true') {
    groupInfo.assigned_can_approve = true
  }
  if (isBudgetAvailable === 'true') {
    groupInfo.use_budget = true
  }
  if (!_.isEmpty(budgetUnit)) {
    groupInfo.budget_unit = formData.budgetUnit
  }

  return createGroup(groupInfo)
    .then((group) => {
      addGroupToStorage(groupsDispatch, diffDispatch, group);
      //TODO if group is not everyone then need to also groupMembersDispatch the creator as in this group
      //TODO can get that from back end if easier as do for market with marketDetails
      return group;
    });
}