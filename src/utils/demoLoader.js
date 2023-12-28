import { pushMessage } from './MessageBusUtils';
import {
  DEMO_EVENT,
  PUSH_STAGE_CHANNEL,
  PUSH_MARKETS_CHANNEL,
  PUSH_PRESENCE_CHANNEL, PUSH_INVESTIBLES_CHANNEL, PUSH_COMMENTS_CHANNEL, PUSH_MEMBER_CHANNEL, PUSH_GROUPS_CHANNEL
} from '../api/versionedFetchUtils';
import _ from 'lodash';
import { TOKEN_TYPE_MARKET } from '../api/tokenConstants';
import TokenStorageManager from '../authorization/TokenStorageManager';

function addComments (market, comments) {
  // make it look like a normal comment push
  const commentDetails = {
    [market.id]: comments
  };
  pushMessage(PUSH_COMMENTS_CHANNEL, { event: DEMO_EVENT, commentDetails });
}

function addInvestibles(investibles) {
  pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: DEMO_EVENT, investibles });
}

function addPresences(market, presences) {
  const { id: marketId } = market;
  pushMessage(PUSH_PRESENCE_CHANNEL, { event: DEMO_EVENT, marketId, presences });
  const users = presences.map((presence) => ({id: presence.id}));
  pushMessage(PUSH_MEMBER_CHANNEL, { event: DEMO_EVENT, groupId: marketId, users });
}

function addStages (market, stageDetails) {
  const { id: marketId } = market;
  pushMessage(PUSH_STAGE_CHANNEL, { event: DEMO_EVENT, marketId, stageDetails });
}

function addGroup(groupDetails) {
  pushMessage(PUSH_GROUPS_CHANNEL, { event: DEMO_EVENT, groupDetails});
}

function addMarket (market) {
  pushMessage(PUSH_MARKETS_CHANNEL, { event: DEMO_EVENT, marketDetails: [market] });
}

export async function handleMarketData(marketData) {
  const {
    market, child_markets: childMarkets,
    comments, investibles, group,
    stages, presences, token
  } = marketData;
  addMarket(market);
  addStages(market, stages);
  addGroup(group);
  addPresences(market, presences);
  addInvestibles(investibles);
  addComments(market, comments);
  const tokenStorageManager = new TokenStorageManager();
  await tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, market.id, token);
  if (!_.isEmpty(childMarkets)) {
    for (const child of childMarkets) {
      await handleMarketData(child);
    }
  }
}
