import _ from 'lodash';
import { TOKEN_TYPE_MARKET } from '../api/tokenConstants';
import TokenStorageManager from '../authorization/TokenStorageManager';
import { addMarketToStorage } from '../contexts/MarketsContext/marketsContextHelper';
import { updateMessages } from '../contexts/NotificationsContext/notificationsContextReducer';
import { updateMarketStages } from '../contexts/MarketStagesContext/marketStagesContextReducer';
import { addGroupMembers } from '../contexts/GroupMembersContext/groupMembersContextReducer';
import { addGroupToStorage } from '../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { addDemoPresencesToMarket } from '../contexts/MarketPresencesContext/marketPresencesHelper';
import { refreshInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper';
import {
  INDEX_COMMENT_TYPE,
  transformItemsToIndexable
} from '../contexts/SearchIndexContext/searchIndexContextMessages';
import { addContents } from '../contexts/DiffContext/diffContextReducer';
import { updateComments } from '../contexts/CommentsContext/commentsContextReducer';

function addComments(commentsDispatch, diffDispatch, index, ticketDispatch, market, comments) {
  const indexable = transformItemsToIndexable(INDEX_COMMENT_TYPE, comments);
  index.addDocuments(indexable.filter((item) => item.type !== 'DELETED'));
  const ticketCodeItems = [];
  comments.forEach((comment) => {
    const { market_id: marketId, id: commentId, group_id: groupId, ticket_code: ticketCode,
      investible_id: investibleId } = comment;
    if (ticketCode) {
      ticketCodeItems.push({ ticketCode, marketId, commentId, groupId, investibleId });
    }
  });
  if (!_.isEmpty(ticketCodeItems)) {
    ticketDispatch({items: ticketCodeItems});
  }
  const fixedUpForDiff = comments.map((comment) => {
    const { id, body: description, updated_by,  updated_by_you } = comment;
    return { id, description, updated_by, updated_by_you };
  });
  diffDispatch(addContents(fixedUpForDiff));
  commentsDispatch(updateComments(market.id, comments));
}

function addInvestibles(dispatch, diffDispatch, investibles) {
  refreshInvestibles(dispatch, diffDispatch, investibles, false);
}

function addPresences(presenceDispatch, memberDispatch, market, presences) {
  const { id: marketId } = market;
  addDemoPresencesToMarket(presenceDispatch, marketId, presences);
  const users = presences.map((presence) => ({id: presence.id}));
  memberDispatch(addGroupMembers(marketId, users));
}

function addStages(dispatch, market, stageDetails) {
  const { id: marketId } = market;
  dispatch(updateMarketStages(marketId, stageDetails));
}

function addGroup(dispatch, groupDetails) {
  addGroupToStorage(dispatch, groupDetails.id, groupDetails);
}

function addMarket(dispatch, market) {
  addMarketToStorage(dispatch, market);
}

export async function handleMarketData(marketData, dispatchers) {
  const {
    market, child_markets: childMarkets,
    comments, investibles, group,
    stages, presences, token, notifications
  } = marketData;
  const {
    marketsDispatch, messagesDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch, groupMembersDispatch,
    investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch
  } = dispatchers;
  if (notifications) {
    messagesDispatch(updateMessages(notifications));
  }
  addStages(marketStagesDispatch, market, stages);
  addGroup(groupsDispatch, group);
  addPresences(presenceDispatch, groupMembersDispatch, market, presences);
  addInvestibles(investiblesDispatch, diffDispatch, investibles);
  addComments(commentsDispatch, diffDispatch, index, ticketsDispatch, market, comments);
  const tokenStorageManager = new TokenStorageManager();
  await tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, market.id, token);
  if (!_.isEmpty(childMarkets)) {
    for (const child of childMarkets) {
      await handleMarketData(child, dispatchers);
    }
  }
  // Add market last so that root doesn't navigate away before data loaded
  addMarket(marketsDispatch, market);
  return market.id;
}
