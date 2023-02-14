import React, { useContext } from 'react';
import Screen from '../../containers/Screen/Screen';
import PlanningDialogEdit from '../Dialog/Planning/PlanningDialogEdit';
import { useLocation } from 'react-router';
import queryString from 'query-string';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getGroup } from '../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions';

function GroupEdit() {
  const location = useLocation();
  const { pathname, search: querySearch } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const values = queryString.parse(querySearch);
  const { groupId } = values || {};
  const [groupState] = useContext(MarketGroupsContext);
  const group = getGroup(groupState, marketId, groupId) || {};

  return (
    <Screen
      title={`${group.name} Settings`}
      tabTitle={`${group.name} Settings`}
    >
      <PlanningDialogEdit group={group} />
    </Screen>
  );
}

export default GroupEdit;