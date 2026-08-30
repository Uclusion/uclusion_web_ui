import React, { useCallback, useContext, useEffect, useReducer } from 'react'
import reducer, { initializeState } from './investiblesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './investiblesContextMessages'
import { DiffContext } from '../DiffContext/DiffContext'
import { INDEX_INVESTIBLE_TYPE } from '../SearchIndexContext/searchIndexContextMessages'
import { SearchIndexContext } from '../SearchIndexContext/SearchIndexContext'
import { replaceIndexItems } from '../SearchIndexContext/searchIndexContextHelper'
import { replaceTicketItems, TicketIndexContext } from '../TicketContext/TicketIndexContext'
import { flushSync } from 'react-dom';

const INVESTIBLES_CHANNEL = 'investibles';
const INVESTIBLES_CONTEXT_NAMESPACE = 'investibles';
const EMPTY_STATE = {initializing: true};

const InvestiblesContext = React.createContext(EMPTY_STATE);
// normally this would be in context hacks directory but we can use this let to get the context out of the react tree
// we don't use a provider, because we have one defined below
let investibleContextHack, attachmentPathHack = {};

function replaceDerivedState(diskState, index, ticketsDispatch) {
  const investibles = Object.values(diskState).filter((item) => item?.investible);
  if (index) {
    replaceIndexItems(index, INDEX_INVESTIBLE_TYPE, investibles);
  }
  Object.keys(attachmentPathHack).forEach((path) => delete attachmentPathHack[path]);
  const ticketCodeItems = []
  investibles.forEach((inv) => {
    const { market_infos: marketInfos, investible } = inv;
    if (investible.attached_files) {
      investible.attached_files.forEach((attachment) => {
        attachmentPathHack[attachment.path] = attachment.original_name;
      });
    }
    marketInfos.forEach((item) => {
      const { market_id: marketId, ticket_code: ticketCode } = item;
      if (ticketCode && !item.deleted) {
        ticketCodeItems.push({ ticketCode, marketId, investibleId: investible.id });
      }
    });
  });
  // Comment ticket rows also have an investibleId, so exclude those from this source replacement.
  ticketsDispatch(replaceTicketItems(ticketCodeItems, 'investibleId', 'commentId'));
}

export { investibleContextHack, attachmentPathHack };

function InvestiblesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, diffDispatch] = useContext(DiffContext);
  const [index] = useContext(SearchIndexContext);
  const [, ticketsDispatch] = useContext(TicketIndexContext);

  const hydrateInvestiblesFromDisk = useCallback(() => {
    const lfg = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
    return lfg.getStoredState().then((diskState) => {
      const hydratedState = diskState || {};
      flushSync(() => {
        replaceDerivedState(hydratedState, index, ticketsDispatch);
        dispatch(initializeState(hydratedState));
      });
      return hydratedState;
    });
  }, [index, ticketsDispatch]);

  useEffect(() => {
    beginListening(dispatch, diffDispatch);
    return () => {};
  }, [diffDispatch]);

  useEffect(() => {
    // load state from storage
    hydrateInvestiblesFromDisk()
      .catch((error) => console.warn('Unable to load investibles from disk', error));
    return () => {};
  }, [hydrateInvestiblesFromDisk]);

  investibleContextHack = state;
  return (
    <InvestiblesContext.Provider value={[state, dispatch, hydrateInvestiblesFromDisk]}>
      {props.children}
    </InvestiblesContext.Provider>
  );
}

export { InvestiblesProvider, InvestiblesContext, EMPTY_STATE, INVESTIBLES_CONTEXT_NAMESPACE, INVESTIBLES_CHANNEL };
