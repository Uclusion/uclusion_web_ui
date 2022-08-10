import { createGroup } from '../../../api/markets'
import _ from 'lodash';
import { addGroupToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'

/**
 * Creates the group from the formdata and does all the magic to make the wizard up date appropriately.
 * @param dispatchers
 * @param formData
 */
export function doCreateGroup(dispatchers, formData) {
  const { marketId, name, votesRequired, ticketSubCode, assignedCanApprove, isBudgetAvailable, budgetUnit,
    toAddClean } = formData;
  const {
    groupsDispatch,
    diffDispatch,
    groupMembersDispatch
  } = dispatchers;

  const groupInfo = {
    name
  };

  if (!_.isEmpty(toAddClean)) {
    groupInfo.participants = toAddClean;
  }
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

  return createGroup(marketId, groupInfo)
    .then((group) => {
      addGroupToStorage(groupsDispatch, diffDispatch, group);
      if (group.id !== group.market_id) {
        //TODO need to push members
      }
      return group;
    });
}