import React, { useEffect, useReducer } from 'react'
import { beginListening } from './ticketIndexContextMessages'
import _ from 'lodash'

const EMPTY_STATE = {};
const TicketIndexContext = React.createContext(EMPTY_STATE);

const reducer = (state, action) => {
  const { items } = action;
  if (items) {
    const ticketHash = _.keyBy(items, (item) => `${item.marketId}/${decodeURI(item.ticketCode)}`);
    return { ...state, ...ticketHash };
  }
  return state;
};

let ticketContextHack;
export { ticketContextHack };

function TicketIndexProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
    beginListening(dispatch);
    return () => {};
  }, []);

  ticketContextHack = state;

  return (
    <TicketIndexContext.Provider value={[state, dispatch]} >
      {props.children}
    </TicketIndexContext.Provider>
  );
}

export { TicketIndexProvider, TicketIndexContext };
