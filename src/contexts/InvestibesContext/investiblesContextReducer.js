import _ from 'lodash';
import LocalForageHelper from '../LocalForageHelper';
import { INVESTIBLES_CONTEXT_NAMESPACE } from './InvestiblesContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_INVESTIBLES = 'UPDATE_INVESTIBLES';

/** Possible messages to reducer * */

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateStorableInvestibles(marketId, investibles) {
  return {
    type: UPDATE_INVESTIBLES,
    marketId,
    investibles,
  };
}


/** Reducer functions */

// expects that the investibles are already in a storable state
function doUpdateInvestibles(state, action) {
  const { investibles: updateHash, marketId } = action;
  // Remove any investibles not included in the update
  const newState = _.pickBy(state, (value) => {
    const { market_infos: marketInfos } = value;
    const { market_id: myMarketId } = marketInfos[0]; // TODO fix if need real sharing
    return myMarketId !== marketId;
  });
  return { ...newState, ...updateHash };
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_INVESTIBLES:
      return doUpdateInvestibles(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}


function reducer(state, action) {
  const newState = computeNewState(state, action);
  const lfh = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;
