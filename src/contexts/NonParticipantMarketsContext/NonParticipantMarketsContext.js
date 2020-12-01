import React, { useReducer } from 'react'
import reducer from './nonParticipantsMarketsContextReducer'

const EMPTY_STATE = {
  initializing: true,
  marketDetails: [],
};

const NonParticipantMarketsContext = React.createContext(EMPTY_STATE);

function NonParticipantsMarketsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  return (
    <NonParticipantMarketsContext.Provider value={[state, dispatch]}>
      {props.children}
    </NonParticipantMarketsContext.Provider>
  );
}

export { NonParticipantsMarketsProvider, NonParticipantMarketsContext };
