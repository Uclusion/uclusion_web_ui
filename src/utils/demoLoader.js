import { pushMessage } from './MessageBusUtils';
import {
  DEMO_EVENT,
  PUSH_STAGE_CHANNEL,
  PUSH_MARKETS_CHANNEL,
  PUSH_PRESENCE_CHANNEL, PUSH_INVESTIBLES_CHANNEL, PUSH_COMMENTS_CHANNEL
} from '../api/versionedFetchUtils';
import _ from 'lodash';
function quickAddComments (market, comments) {
  // make it look like a normal comment push
  const commentDetails = {
    [market.id]: comments
  };
  pushMessage(PUSH_COMMENTS_CHANNEL, { event: DEMO_EVENT, commentDetails });
}

function quickAddInvestibles(investibles) {
  pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: DEMO_EVENT, investibles });
}

function quickAddPresences(market, myUser, demoUser, presences) {
  const { id: marketId } = market;
  if (myUser != null && demoUser != null) {
    // remove the demo user
    presences.filter((user) => user.id !== demoUser.id);
    presences.push(myUser);
    presences.forEach((presence) => {
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: DEMO_EVENT, marketId, presence });
    });
  }
}

function quickAddStages (market, stageDetails) {
  const { id: marketId } = market;
  pushMessage(PUSH_STAGE_CHANNEL, { event: DEMO_EVENT, marketId, stageDetails });
}

function quickAddMarket (market) {
  pushMessage(PUSH_MARKETS_CHANNEL, { event: DEMO_EVENT, marketDetails: [market] });
}

function handleMarketData (marketData, myUser, demoUser) {
  const {
    market, child_markets: childMarkets,
    comments, investibles,
    stages, presences
  } = marketData;
  quickAddMarket(market);
  quickAddStages(market, stages);
  quickAddPresences(market, myUser, demoUser, presences);
  quickAddInvestibles(investibles);
  quickAddComments(market, comments);
  if (!_.isEmpty(childMarkets)) {
    childMarkets.forEach((market) => handleMarketData(market, myUser, demoUser));
  }
  console.debug("Done quick adding demo");
}

export function quickAddDemo (demo) {
  const {
    market, my_user: myUser, demo_user: demoUser
  } = demo;

  handleMarketData(market, myUser, demoUser);
}
