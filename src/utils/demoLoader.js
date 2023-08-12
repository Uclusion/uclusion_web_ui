import { pushMessage } from './MessageBusUtils';
import {
  DEMO_EVENT,
  PUSH_STAGE_CHANNEL,
  PUSH_MARKETS_CHANNEL,
  PUSH_PRESENCE_CHANNEL, PUSH_INVESTIBLES_CHANNEL, PUSH_COMMENTS_CHANNEL, PUSH_MEMBER_CHANNEL
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

function addPresences(market, myUser, demoUser, presences) {
  const { id: marketId } = market;
  if (myUser != null && demoUser != null) {
    // remove the demo user
    presences.filter((user) => user.id !== demoUser.id);
    presences.push(myUser);
    pushMessage(PUSH_PRESENCE_CHANNEL, { event: DEMO_EVENT, marketId, presences });
    const users = presences.map((presence) => ({id: presence.id}));
    pushMessage(PUSH_MEMBER_CHANNEL, { event: DEMO_EVENT, groupId: marketId, users });
  }
}

function addStages (market, stageDetails) {
  const { id: marketId } = market;
  pushMessage(PUSH_STAGE_CHANNEL, { event: DEMO_EVENT, marketId, stageDetails });
}

function addMarket (market) {
  pushMessage(PUSH_MARKETS_CHANNEL, { event: DEMO_EVENT, marketDetails: [market] });
}

function handleMarketData(marketData, myUser, demoUser) {
  const {
    market, child_markets: childMarkets,
    comments, investibles,
    stages, presences, token
  } = marketData;
  addMarket(market);
  addStages(market, stages);
  addPresences(market, myUser, demoUser, presences);
  addInvestibles(investibles);
  addComments(market, comments);
  if (!_.isEmpty(childMarkets)) {
    childMarkets.forEach((child) => handleMarketData(child, myUser, demoUser));
  }
  const tokenStorageManager = new TokenStorageManager();
  tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, market.id, token).then(() => {
    console.info(`Done demo quick adding for ${market.id}`);
  });
}

export function addDemo (demo) {
  const {
     my_user: myUser, demo_user: demoUser
  } = demo;
  // we call a second function here, because I want to recurse on the structure
  // of the market part of the demo, but hold myUser and demoUser constant
  // in that recursion
  handleMarketData(demo, myUser, demoUser);
}
