import React, { useEffect, useReducer } from 'react'
import { beginListening } from './ticketIndexContextMessages'
import _ from 'lodash'

const EMPTY_STATE = {};
const TicketIndexContext = React.createContext(EMPTY_STATE);
const REPLACE_ITEMS = 'replace_items';

export function replaceTicketItems(items, itemIdKey, excludedIdKey) {
  return { type: REPLACE_ITEMS, items, itemIdKey, excludedIdKey };
}

const reducer = (state, action) => {
  const { items, itemIdKey, excludedIdKey, type } = action;
  if (items) {
    const ticketHash = _.keyBy(items, (item) => `${item.marketId}/${decodeURI(item.ticketCode)}`);
    const existing = type === REPLACE_ITEMS
      ? _.omitBy(state, (item) => item?.[itemIdKey] !== undefined &&
        (!excludedIdKey || item?.[excludedIdKey] === undefined))
      : state;
    return { ...existing, ...ticketHash };
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
