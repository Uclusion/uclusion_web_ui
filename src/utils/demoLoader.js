import _ from 'lodash';
import { TOKEN_TYPE_MARKET } from '../api/tokenConstants';
import TokenStorageManager from '../authorization/TokenStorageManager';
import { addMarketToStorage } from '../contexts/MarketsContext/marketsContextHelper';
import { updateMessages } from '../contexts/NotificationsContext/notificationsContextReducer';
import { updateMarketStages } from '../contexts/MarketStagesContext/marketStagesContextReducer';
import { addGroupToStorage } from '../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { addDemoPresencesToMarket } from '../contexts/MarketPresencesContext/marketPresencesHelper';
import { refreshInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper';
import { addCommentsOther } from '../contexts/CommentsContext/commentsContextMessages';
import { updateComments } from '../contexts/CommentsContext/commentsContextReducer';
import { addGroupMembers } from '../contexts/GroupMembersContext/groupMembersContextReducer';

function addInvestibles(dispatch, diffDispatch, investibles) {
  refreshInvestibles(dispatch, diffDispatch, investibles, false);
}

function addPresences(presenceDispatch, market, presences) {
  const { id: marketId } = market;
  addDemoPresencesToMarket(presenceDispatch, marketId, presences);
}

function addStages(dispatch, market, stageDetails) {
  const { id: marketId } = market;
  dispatch(updateMarketStages(marketId, stageDetails));
}

function addGroup(dispatch, marketId, groupDetails) {
  addGroupToStorage(dispatch, marketId, groupDetails);
}

function addMarket(dispatch, market) {
  addMarketToStorage(dispatch, market);
}

export function handleMarketData(marketData, dispatchers) {
  const {
    market, child_markets: childMarkets,
    comments, investibles, group_infos: groupInfos,
    stages, presences, token, notifications
  } = marketData;
  const { marketsDispatch, messagesDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch,
    groupMembersDispatch, investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch,
    setInitialized } = dispatchers;
  if (notifications) {
    messagesDispatch(updateMessages(notifications));
    setInitialized(true);
  }
  addStages(marketStagesDispatch, market, stages);
  groupInfos?.forEach(groupInfo => {
    const { group, members } = groupInfo;
    addGroup(groupsDispatch, market.id, group);
    groupMembersDispatch(addGroupMembers(market.id, group.id, members));
  });
  addPresences(presenceDispatch, market, presences);
  addInvestibles(investiblesDispatch, diffDispatch, investibles);
  addCommentsOther(diffDispatch, index, ticketsDispatch, comments);
  commentsDispatch(updateComments(market.id, comments));
  const tokenStorageManager = new TokenStorageManager();
  return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, market.id, token).then(() => {
    if (!_.isEmpty(childMarkets)) {
      for (const child of childMarkets) {
        return handleMarketData(child, dispatchers).then(() => {
          // Add market last so that root doesn't navigate away before data loaded
          addMarket(marketsDispatch, market);
          return market.id;
        });
      }
    }
    addMarket(marketsDispatch, market);
    return market.id;
  });
}
