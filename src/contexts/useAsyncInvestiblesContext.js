import { useContext } from 'react';
import { AsyncInvestiblesContext } from './AsyncInvestiblesContext';
import { fetchInvestibles, fetchInvestibleList } from '../api/marketInvestibles';
import _ from 'lodash';

function useAsyncInvestiblesContext() {
  const { stateCache, getState, setStateValues, loadingWrapper } = useContext(AsyncInvestiblesContext);

  function updateInvestibles(state, updateHash) {
    const { investibles } = state;
    const newInvestibles = { ...investibles, ...updateHash };
    return setStateValues({ investibles: newInvestibles });
  }

  function refreshInvestibles(marketId) {
    // the loading wrapper can't pass arguments, so we
    // need to bind market id with a closure
    const refresher = () => {
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
          return getState()
            .then((state) => updateInvestibles(state, investibleHash));
        });
    };
    return loadingWrapper(refresher);
  }

  function updateInvestibleLocally(investible) {
    const { id } = investible.investible;
    return getState()
      .then((state) => updateInvestibles(state, { [id]: investible }));
  }

  function addInvestibleLocally(investible) {
    // since it's a full investible, we can just do the same thing as
    // updateInvestibleLocally
    return updateInvestibleLocally(investible);
  }

  function getCachedInvestibles(marketId) {
    const { investibles } = stateCache;

    const values = Object.values(investibles);
    const found = values.filter((inv) => {
      const { market_infos } = inv;
      return market_infos.find((info) => info.market_id === marketId);
    });
    return found;
  }

  return {
    refreshInvestibles,
    getCachedInvestibles,
    updateInvestibleLocally,
    addInvestibleLocally,
    ...stateCache,
  };
}

export default useAsyncInvestiblesContext;
