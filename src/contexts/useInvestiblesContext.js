import { useContext } from 'react';
import { InvestiblesContext } from './InvestiblesContext';
import { fetchInvestibles, fetchInvestibleList } from '../api/marketInvestibles';
import _ from 'lodash';

function useInvestiblesContext() {
  const [state, setState] = useContext(InvestiblesContext);

  function refreshInvestibles(marketId) {
    return fetchInvestibleList(marketId)
      .then((investibleList) => {
        if (_.isEmpty(investibleList)){
          return Promise.resolve([]);
        }
        const idList = investibleList.map(investible => investible.id);
        return fetchInvestibles(idList, marketId);
      }).then((investibles) => {
        setState({ [marketId]: investibles });
      });
  }

  function getInvestibles(marketId) {
    return state[marketId] || [];
  }

  return {
    refreshInvestibles,
    getInvestibles,
  };
}

export default useInvestiblesContext;
