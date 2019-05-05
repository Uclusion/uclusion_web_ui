import { ERROR, sendIntlMessage } from './userMessage';
import { getClient } from '../config/uclusionClient';

export function processUserForDisplay(user, marketId) {
  const processed = { ...user };
  const marketPresence = user.market_presences.find(presence => presence.market_id === marketId);
  processed.quantity = marketPresence.quantity;
  processed.quantity_invested = marketPresence.quantity_invested;
  return processed;
}

export function loadTeams(canListAccountTeams, marketId, setTeams) {
  const clientPromise = getClient();
  if (canListAccountTeams) {
    clientPromise.then(client => client.teams.list(marketId)).then((marketTeams) => {
      setTeams(marketTeams);
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
    });
  } else {
    clientPromise.then(client => client.teams.mine(marketId)).then((myTeams) => {
      setTeams(myTeams);
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'teamsLoadFailed' });
    });
  }
}