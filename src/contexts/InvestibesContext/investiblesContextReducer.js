import LocalForageHelper from '../LocalForageHelper';
import { INVESTIBLES_CONTEXT_NAMESPACE } from './InvestiblesContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_INVESTIBLES = 'UPDATE_INVESTIBLES';

/** Possible messages to reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateStorableInvestibles(investibles) {
  return {
    type: UPDATE_INVESTIBLES,
    investibles,
  };
}


/** Reducer functions **/

function doStoreInvestible(state, action) {
  const { investible } = action;
  const { id } = investible;
  const newState = {
    ...state,
    [id]: investible,
  };
  return newState;
}
// expects that the investibles are already in a storable state
// since it acce
function doUpdateInvestibles(state, action) {
  const { investibles: updateHash } = action;
  console.log(updateHash);
  return { ...state, ...updateHash };
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
