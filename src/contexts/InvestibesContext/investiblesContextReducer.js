import LocalForageHelper from '../LocalForageHelper';
import { INVESTIBLES_CONTEXT_NAMESPACE } from './InvestiblesContext';
import { INITIALIZE_STATE } from '../MarketsContext/marketsContextReducer';

export const UPDATE_INVESTIBLES = 'UPDATE_INVESTIBLES';
export const UPDATE_INVESTIBLE = 'UPDATE_INVESTIBLE';
export const ADD_INVESTIBLE = 'ADD_INVESTIBLE';

/** Possible messages to reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateInvestible(investible) {
  return {
    type: UPDATE_INVESTIBLE,
    investible,
  };
}

export function addInvestible(investible) {
  return {
    type: ADD_INVESTIBLE,
    investible,
  };
}

export function updateInvestibles(investibles) {
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

function doUpdateInvestibles(state, action) {
  const { investibles: updateHash } = action;
  console.log(updateHash);
  const { investibles } = state;
  const newInvestibles = { ...investibles, ...updateHash };
  return newInvestibles;
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_INVESTIBLES:
      return doUpdateInvestibles(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    case ADD_INVESTIBLE:
    case UPDATE_INVESTIBLE:
      return doStoreInvestible(state, action);
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
