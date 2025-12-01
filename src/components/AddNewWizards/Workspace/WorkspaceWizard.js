import React, { useContext } from 'react';
import WorkspaceNameStep from './WorkspaceNameStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import { useHistory } from 'react-router';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { accountUserRefresh } from '../../../contexts/AccountContext/accountContextReducer';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { addGroupsToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { updateMarketStagesFromNetwork } from '../../../contexts/MarketStagesContext/marketStagesContextReducer';
import { addPresenceToMarket, changeBanStatus } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { addGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';
import TokenStorageManager from '../../../authorization/TokenStorageManager';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { fixName } from '../../../utils/userFunctions';
import { createPlanning } from '../../../api/markets';
import { DEMO_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import { TOKEN_TYPE_MARKET } from '../../../api/tokenConstants';
import _ from 'lodash';
import WorkspaceViewStep from './WorkspaceViewStep';

function WorkspaceWizard() {
  const history = useHistory();
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [presenceState, presenceDispatch] = useContext(MarketPresencesContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const [userState, userDispatch] = useContext(AccountContext);
  const [, stagesDispatch] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);

  function getInitials(name) {
    const words = name.split(' ');
    let initials = '';
    for (const word of words) {
      if (word.length > 0) {
        initials += word[0].toUpperCase();
      }
    }
    return initials;
  }

  function createWorkspace(formData, isSinglePersonMode = false) {
    const { name } = formData;
    const marketInfo = {
      name,
      is_autonomous_group: isSinglePersonMode
    };
    if (isSinglePersonMode) {
      const userName = fixName(userState.user.name);
      marketInfo.group_name = userName.slice(0, 80);
      marketInfo.ticket_sub_code = getInitials(userName);
    } else {
      marketInfo.group_name = formData.group_name;
    }
    return createPlanning(marketInfo)
      .then((marketDetails) => {
        const {
          market,
          presence,
          stages,
          token,
          group,
          market_creator: user,
          default_members: defaultMembers
        } = marketDetails;
        const createdMarketId = market.id;
        if (user) {
          userDispatch(accountUserRefresh(user));
        }
        addMarketToStorage(marketsDispatch, market);
        addGroupsToStorage(groupsDispatch, { [createdMarketId]: [group]});
        stagesDispatch(updateMarketStagesFromNetwork({[createdMarketId]: stages }));
        addPresenceToMarket(presenceDispatch, createdMarketId, presence);
        groupMembersDispatch(addGroupMembers(createdMarketId, createdMarketId, defaultMembers));
        const demos = marketsState?.marketDetails?.filter((market) => market.market_type === PLANNING_TYPE &&
          market.object_type === DEMO_TYPE);
        if (!_.isEmpty(demos) && user){
          demos.forEach((demo) => changeBanStatus(presenceState, presenceDispatch, demo.id, user.id, true, commentsState));
          const { messages } = (state || {});
          const demoMarketIds = demos.map((demo) => demo.id);
          const demoMessages = messages?.filter((message) => demoMarketIds.includes(message.market_id));
          const typeObjectIds = demoMessages?.map((message) => message.type_object_id);
          if (!_.isEmpty(typeObjectIds)) {
            messagesDispatch(quickRemoveMessages(typeObjectIds));
          }
        }
        const tokenStorageManager = new TokenStorageManager();
        return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, createdMarketId, token)
          .then(() => {
            setOperationRunning(false);
            return navigate(history, formMarketLink(market.id, market.id));
          });
      });

  }

  return (
    <WizardStylesProvider>
      <FormdataWizard
        useLocalStorage={false}
        name="workspace_wizard"
      >
        <WorkspaceNameStep createWorkspace={createWorkspace} />
        <WorkspaceViewStep createWorkspace={createWorkspace} />
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default WorkspaceWizard

