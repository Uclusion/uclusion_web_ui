import LocalForageHelper from '../../utils/LocalForageHelper'
import { INVESTIBLES_CONTEXT_NAMESPACE } from './InvestiblesContext'

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_INVESTIBLES = 'UPDATE_INVESTIBLES';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';

/** Possible messages to reducer * */

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

export function versionsUpdateInvestibles(investibles) {
  return {
    type: UPDATE_FROM_VERSIONS,
    investibles,
  };
}


/** Reducer functions */

// expects that the investibles are already in a storable state
function doUpdateInvestibles(state, action) {
  const { investibles: updateHash } = action;
  const { initializing } = state;
  if (initializing) {
    return updateHash;
  }
  return { ...state, ...updateHash };
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_INVESTIBLES:
    case UPDATE_FROM_VERSIONS:
      return doUpdateInvestibles(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}


function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type === UPDATE_FROM_VERSIONS) {
    const lfh = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
    lfh.setState(newState);
  }
  return newState;
}

export default reducer;
