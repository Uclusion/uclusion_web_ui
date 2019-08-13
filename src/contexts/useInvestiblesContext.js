import { useContext } from 'react';
import { InvestiblesContext } from './InvestiblesContext';
import { fetchInvestibles, fetchInvestibleList } from '../api/marketInvestibles';
import _ from 'lodash';

function useInvestiblesContext() {
  const [state, setState] = useContext(InvestiblesContext);

  function refreshInvestibles(marketId) {
    return fetchInvestibleList(marketId)
      .then(idList => {
        if (_.isEmpty(idList)){
          return Promise.resolve([]);
        }
        return fetchInvestibles(idList, marketId);
      }).then((investibles) => {
        setState({ [marketId]: investibles });
      });
  }

  function getInvestibles(marketId){
    return state[marketId];
  }

  return {
    refreshInvestibles,
    getInvestibles,
  };
}

export default useInvestiblesContext;
