import React, { useEffect, useReducer } from 'react'
import { beginListening } from './ticketIndexContextMessages'
import _ from 'lodash'

const EMPTY_STATE = {};
const TicketIndexContext = React.createContext(EMPTY_STATE);

function TicketIndexProvider(props) {
  const [state, dispatch] = useReducer((state, action) => {
    const { items } = action;
    if (items) {
      const ticketHash = _.keyBy(items, (item) => item.ticketCode);
      return { ...state, ...ticketHash };
    }
    return state;
  }, EMPTY_STATE);

  useEffect(() => {
    beginListening(dispatch);
    return () => {};
  }, []);

  return (
    <TicketIndexContext.Provider value={[state]} >
      {props.children}
    </TicketIndexContext.Provider>
  );
}

export { TicketIndexProvider, TicketIndexContext };
