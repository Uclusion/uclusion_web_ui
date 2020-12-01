import _ from 'lodash'

const UPDATE_MARKET_DETAILS = 'UPDATE_MARKET_DETAILS';

/* Possible messages to the reducer */

export function updateNonParticipatingMarketDetails(marketDetails) {
  return {
    type: UPDATE_MARKET_DETAILS,
    marketDetails,
  };
}

/* Functions that mutate state */

function doUpdateMarketDetails(state, action) {
  const { marketDetails } = action;
  const { marketDetails: oldMarketDetails } = state;
  const newDetails = _.unionBy(marketDetails, oldMarketDetails, 'id');
  const { initializing } = state;
  if (initializing) {
    return {
      marketDetails: newDetails,
    };
  }
  return {
    ...state,
    marketDetails: newDetails,
  };
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_MARKET_DETAILS:
      return doUpdateMarketDetails(state, action);
    default:
      return state;
  }
}

function reducer(state, action) {
  return computeNewState(state, action);
}

export default reducer;
