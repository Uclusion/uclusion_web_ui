import _ from 'lodash';
import { fetchInvestibleList, fetchInvestibles } from '../../api/marketInvestibles';
import { updateInvestibles } from './investiblesContextReducer';
import

export function getMarketInvestibles(state, marketId) {
  const values = Object.values(state);
  const found = values.filter((inv) => {
    const { market_infos } = inv;
    return market_infos.find((info) => info.market_id === marketId);
  });
  return found;
}

export function refreshInvestibles(dispatch, marketId) {
  return fetchInvestibleList(marketId)
    .then((investibleList) => {
      console.debug(investibleList);
      if (_.isEmpty(investibleList)) {
        return Promise.resolve([]);
      }
      const idList = investibleList.map((investible) => investible.id);
      return fetchInvestibles(idList, marketId);
    }).then((investibles) => {
      console.debug(investibles);
      const investibleHash = _.keyBy(investibles, (item) => item.investible.id);
      console.debug(investibleHash);
      dispatch(updateInvestibles(investibleHash));
    });
}
