import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import { formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { ArrowBack } from '@material-ui/icons';
import { getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import _ from 'lodash';
import { useHotkeys } from 'react-hotkeys-hook';
import { SUPPORT_SUB_TYPE } from '../../constants/markets';
import { getActiveGroupId } from '../../containers/Screen/Screen';
import { usePresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';

function ReturnTop(props) {
  const { action, pathInvestibleId, market, groupId, pathMarketIdRaw, hashInvestibleId, isArchivedWorkspace,
    useLink, typeObjectId } = props;
  const [investiblesState] = useContext(InvestiblesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const intl = useIntl();
  const history = useHistory();
  const presences = usePresences(market.id);
  const isConfigScreen = ['userPreferences', 'integrationPreferences', 'billing'].includes(action);
  const marketId = market.id;
  const isSupportMarket = market.market_sub_type === SUPPORT_SUB_TYPE;
  const upFromConfigPossible = isConfigScreen && marketId;
  const downLevel = action === 'inbox' ? !_.isEmpty(pathMarketIdRaw) :
    (action === 'wizard' ? !_.isEmpty(groupId || marketId) :
      (action === 'marketEdit' ? marketId : (['groupEdit', 'groupArchive'].includes(action)  ? groupId :
        !_.isEmpty(pathInvestibleId))));
  const upDisabled = ((!downLevel ||
      !['dialog', 'inbox', 'wizard', 'marketEdit', 'groupEdit', 'groupArchive'].includes(action))
    &&!upFromConfigPossible&&!isSupportMarket)||isArchivedWorkspace;
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const activeGroupId = getActiveGroupId(myPresence, groupsState, marketId, presences, groupPresencesState, groupId, 
    pathInvestibleId || hashInvestibleId, investiblesState);

  function goUp(){
    if (action === 'inbox') {
      navigate(history, getInboxTarget());
    } else if (useLink) {
      navigate(history, useLink);
    }else if (upFromConfigPossible) {
      navigate(history, formMarketLink(marketId, marketId));
    } else if (action === 'wizard' && typeObjectId) {
      navigate(history, getInboxTarget());
    } else if (action === 'wizard' && hashInvestibleId) {
      navigate(history, formInvestibleLink(marketId, hashInvestibleId));
    } else if (action === 'marketEdit' || (action === 'wizard' && marketId && !activeGroupId)) {
      navigate(history, formMarketLink(marketId, marketId));
    } else if (activeGroupId && downLevel) {
      navigate(history, formMarketLink(marketId, activeGroupId));
    } else {
      navigate(history, getInboxTarget());
    }
  }

  useHotkeys('ctrl+arrowUp', goUp, {enabled: !upDisabled, enableOnContentEditable: true},
    [history, useLink, upFromConfigPossible, marketId, action, hashInvestibleId, activeGroupId]);

  return (
    <div style={{marginBottom: '1.5rem', marginTop: '0.5rem'}}>
      <TooltipIconButton disabled={upDisabled} icon={<ArrowBack htmlColor={upDisabled ? 'disabled' : 'black'} fontSize='small'/>}
                         onClick={goUp} translationId="upNavigation">
        <span style={{ paddingLeft: '0.5rem', color: 'black' }}>{intl.formatMessage({ id: 'up' })}</span>
      </TooltipIconButton>
    </div>
  );

}

export default ReturnTop;