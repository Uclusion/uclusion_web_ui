import { useContext } from 'react';
import { AsyncInvestiblesContext } from './AsyncInvestiblesContext';
import { fetchInvestibles, fetchInvestibleList } from '../api/marketInvestibles';
import _ from 'lodash';

function useInvestiblesContext() {
  const { stateCache, setStateValues } = useContext(AsyncInvestiblesContext);

  function refreshInvestibles(marketId) {
    return fetchInvestibleList(marketId)
      .then((investibleList) => {
        console.debug(investibleList);
        if (_.isEmpty(investibleList)) {
          return Promise.resolve([]);
        }
        const idList = investibleList.map(investible => investible.id);
        return fetchInvestibles(idList, marketId);
      }).then((investibles) => {
        setStateValues({ [marketId]: investibles });
      });
  }

  function getCachedInvestibles(marketId) {
    return stateCache[marketId] || [];
  }

  return {
    refreshInvestibles,
    getCachedInvestibles,
  };
}

export default useInvestiblesContext;
