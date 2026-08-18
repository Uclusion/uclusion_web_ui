import React, { useContext } from 'react';
import { useHistory } from 'react-router';
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper';
import _ from 'lodash';
import { useHotkeys } from 'react-hotkeys-hook';
import { SUPPORT_SUB_TYPE } from '../../constants/markets';
import { getActiveGroupId } from '../../containers/Screen/Screen';
import { usePresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { ArrowUpward } from '@material-ui/icons';
import { useButtonColors } from '../../components/Buttons/ButtonConstants';

export function getUpUrl({ action, pathInvestibleId, market, groupId, pathMarketIdRaw, hashInvestibleId,
  isArchivedWorkspace, useLink, typeObjectId, presences, groupsState, groupPresencesState, investiblesState }) {
  const marketId = market?.id;
  const isConfigScreen = ['userPreferences', 'integrationPreferences', 'billing'].includes(action);
  const isSupportMarket = market?.market_sub_type === SUPPORT_SUB_TYPE;
  const upFromConfigPossible = isConfigScreen && marketId;
  const downLevel = ['inbox', 'outbox'].includes(action) ? !_.isEmpty(pathMarketIdRaw) :
    (['wizard', 'demo'].includes(action) ? !_.isEmpty(groupId || marketId) :
      (action === 'marketEdit' ? marketId : (['groupEdit', 'groupArchive'].includes(action)  ? groupId :
        !_.isEmpty(pathInvestibleId))));
  const upDisabled = ((!downLevel ||
      !['dialog', 'inbox', 'outbox', 'demo', 'wizard', 'marketEdit', 'groupEdit', 'groupArchive'].includes(action))
    &&!upFromConfigPossible&&!isSupportMarket)||isArchivedWorkspace;
  if (upDisabled) {
    return undefined;
  }
  const myPresence = (presences || []).find((presence) => presence.current_user) || {};
  const activeGroupId = getActiveGroupId(myPresence, groupsState, marketId, presences, groupPresencesState, groupId,
    pathInvestibleId || hashInvestibleId, investiblesState);
  if (action === 'inbox') {
    return getInboxTarget();
  }
  if (action === 'outbox') {
    return '/outbox';
  }
  if (action === 'demo') {
    return formMarketLink(marketId, marketId);
  }
  if (useLink) {
    return useLink;
  }
  if (upFromConfigPossible) {
    return formMarketLink(marketId, marketId);
  }
  if (action === 'wizard' && typeObjectId) {
    return getInboxTarget();
  }
  if (action === 'wizard' && hashInvestibleId) {
    return formInvestibleLink(marketId, hashInvestibleId);
  }
  if (action === 'marketEdit' || (action === 'wizard' && marketId && !activeGroupId)) {
    return formMarketLink(marketId, marketId);
  }
  if (activeGroupId && downLevel) {
    return formMarketLink(marketId, activeGroupId);
  }
  return getInboxTarget();
}

function ReturnTop(props) {
  const { action, pathInvestibleId, market, groupId, pathMarketIdRaw, hashInvestibleId, isArchivedWorkspace,
    useLink, typeObjectId, isSearch=false, isMac=false } = props;
  const [investiblesState] = useContext(InvestiblesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const history = useHistory();
  const presences = usePresences(market?.id);
  const { actionButtonColor } = useButtonColors();
  const upUrl = getUpUrl({ action, pathInvestibleId, market, groupId, pathMarketIdRaw, hashInvestibleId,
    isArchivedWorkspace, useLink, typeObjectId, presences, groupsState, groupPresencesState, investiblesState });
  const upDisabled = _.isEmpty(upUrl);

  function goUp(){
    if (upUrl) {
      navigate(history, upUrl);
    }
  }

  useHotkeys(isMac ? 'ctrl+option+arrowUp' : 'ctrl+arrowUp', goUp, {enabled: !upDisabled, enableOnContentEditable: true},
    [history, upUrl]);


  if (isSearch && pathInvestibleId) {
    return (
      <div style={{marginRight: '0.5rem', marginLeft: '0.5rem', marginBottom: '0.5rem'}}>
        <TooltipIconButton disabled={upDisabled} icon={<ArrowUpward htmlColor={upDisabled ? 'disabled' : actionButtonColor} />}
                           onClick={goUp} translationId="upNavigation" />
      </div>
    );
  }

  return React.Fragment;
}

export default ReturnTop;