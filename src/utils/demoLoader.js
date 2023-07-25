import { pushMessage } from './MessageBusUtils';
import {
  DEMO_EVENT,
  PUSH_STAGE_CHANNEL,
  PUSH_MARKETS_CHANNEL,
  PUSH_PRESENCE_CHANNEL, PUSH_INVESTIBLES_CHANNEL, PUSH_COMMENTS_CHANNEL
} from '../api/versionedFetchUtils';
import _ from 'lodash';
function quickAddComments(marketId, comments) {
  pushMessage(PUSH_COMMENTS_CHANNEL, { event: DEMO_EVENT, commentDetails: { [marketId]: comments} });
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

function quickAddStages (market, stages) {
  const { id: marketId } = market;
  pushMessage(PUSH_STAGE_CHANNEL, { event: DEMO_EVENT, marketId, stageDetails: stages });
}

function quickAddMarket (market) {
  pushMessage(PUSH_MARKETS_CHANNEL, { event: DEMO_EVENT, marketDetails: [market] });
}

function handleMarketData (marketData) {
  const {
    market, comments, investibles,
    stages, presences,
    my_user: myUser, demo_user: demoUser,
    child_markets: childMarkets
  } = marketData;
  quickAddMarket(market);
  quickAddStages(market, stages);
  quickAddPresences(market, myUser, demoUser, presences);
  quickAddInvestibles(investibles);
  quickAddComments(market.id, comments);
  if (!_.isEmpty(childMarkets)) {
    childMarkets.forEach((childMarket) => handleMarketData(childMarket));
  }
}

export function quickAddDemo (demo) {
  handleMarketData(demo);
}
