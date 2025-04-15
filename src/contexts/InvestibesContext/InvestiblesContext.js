import React, { useContext, useEffect, useReducer } from 'react'
import reducer, { initializeState } from './investiblesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './investiblesContextMessages'
import { DiffContext } from '../DiffContext/DiffContext'
import { pushMessage } from '../../utils/MessageBusUtils'
import {
  INDEX_INVESTIBLE_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages'
import { TICKET_INDEX_CHANNEL } from '../TicketContext/ticketIndexContextMessages'

const INVESTIBLES_CHANNEL = 'investibles';
const INVESTIBLES_CONTEXT_NAMESPACE = 'investibles';
const EMPTY_STATE = {initializing: true};

const InvestiblesContext = React.createContext(EMPTY_STATE);

function pushIndexItems(diskState) {
  const investibles = Object.values(diskState).filter((item) => item.investible) || [];
  const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_INVESTIBLE_TYPE, items: investibles };
  pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
  const ticketCodeItems = []
  investibles.forEach((inv) => {
    const { market_infos: marketInfos, investible } = inv;
    marketInfos.forEach((item) => {
      const { market_id: marketId, ticket_code: ticketCode } = item;
      if (ticketCode) {
        ticketCodeItems.push({ ticketCode, marketId, investibleId: investible.id });
      }
    });
  });
  pushMessage(TICKET_INDEX_CHANNEL, ticketCodeItems);
}

// normally this would be in context hacks directory but we can use this let to get the context out of the react tree
// we don't use a provider, because we have one defined below
let investibleContextHack;
export { investibleContextHack };

function InvestiblesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, diffDispatch] = useContext(DiffContext);

  useEffect(() => {
    beginListening(dispatch, diffDispatch);
    return () => {};
  }, [diffDispatch]);

  useEffect(() => {
    // load state from storage
    const lfg = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          pushIndexItems(state);
          dispatch(initializeState(state));
        } else {
          dispatch(initializeState({}));
        }
      });
    return () => {};
  }, []);

  investibleContextHack = state;
  return (
    <InvestiblesContext.Provider value={[state, dispatch]}>
      {props.children}
    </InvestiblesContext.Provider>
  );
}

export { InvestiblesProvider, InvestiblesContext, EMPTY_STATE, INVESTIBLES_CONTEXT_NAMESPACE, INVESTIBLES_CHANNEL };
