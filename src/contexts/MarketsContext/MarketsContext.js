import React, { useContext, useEffect, useReducer, useState } from 'react'
import beginListening from './marketsContextMessages'
import reducer, { initializeState } from './marketsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { DiffContext } from '../DiffContext/DiffContext'
import { INDEX_MARKET_TYPE, INDEX_UPDATE, SEARCH_INDEX_CHANNEL } from '../SearchIndexContext/searchIndexContextMessages'
import { pushMessage } from '../../utils/MessageBusUtils'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import _ from 'lodash'
import { getInvitationMarker } from '../../utils/redirectUtils'
import { getChangedIds } from '../../api/summaries'
import { createECPMarkets } from '../../pages/Invites/ECPMarketGenerator'
import { INVITE_STORIES_WORKSPACE_FIRST_VIEW } from '../TourContext/tourContextHelper'
import { toastError } from '../../utils/userMessage'
import { START_TOUR, TOUR_CHANNEL } from '../TourContext/tourContextMessages'

const MARKET_CONTEXT_NAMESPACE = 'market_context';
const EMPTY_STATE = {
  initializing: true,
  marketDetails: [],
};
const MARKETS_CHANNEL = 'markets';
const MarketsContext = React.createContext(EMPTY_STATE);

function pushIndexItems(diskState) {
  const { marketDetails } = diskState;
  const indexMessage = { event: INDEX_UPDATE, itemType: INDEX_MARKET_TYPE, items: marketDetails };
  pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
}

// normally this would be in context hacks directory but we can use this let to get the context out of the react tree
// we don't use a provider, because we have one defined below
let marketsContextHack;
export { marketsContextHack };

function MarketsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, diffDispatch] = useContext(DiffContext);
  const [, setChannel] = useState(undefined);

  useEffect(() => {
    const myChannel = new BroadcastChannel(MARKETS_CHANNEL);
    myChannel.onmessage = (msg) => {
      if (typeof msg.includes === 'function' && msg.includes('dialog')) {
        console.info(`Redirecting from market context to ${msg}`);
        // Special for onboarding because the verify email tab might also be open
        window.location.assign(msg);
      } else if (msg !== broadcastId) {
        console.info(`Reloading on markets channel message ${msg} with ${broadcastId}`);
        const lfg = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
        lfg.getState()
          .then((diskState) => {
            if (diskState) {
              pushIndexItems(diskState);
              dispatch(initializeState(diskState));
            }
          });
      }
    }
    setChannel(myChannel);
    return () => {};
  }, []);

  useEffect(() => {
    beginListening(dispatch, diffDispatch);
    return () => {};
  }, [diffDispatch]);

  useEffect(() => {
    // load state from storage
    const lfg = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((diskState) => {
        if (diskState) {
          pushIndexItems(diskState);
          dispatch(initializeState(diskState));
        } else {
          console.log('Beginning markets initialization');
          dispatch(initializeState({
            marketDetails: [],
          }));
          if (_.isEmpty(getInvitationMarker())) {
            console.log('Checking for existing markets');
            // Call the API before potential accidental duplicate demo market creation
            getChangedIds(null).then((versions) => {
              const {
                foreground: foregroundList, background: backgroundList, banned: bannedList
              } = versions;
              // Do not create onboarding markets if they already have markets
              if (_.isEmpty(foregroundList) && _.isEmpty(backgroundList) && _.isEmpty(bannedList)) {
                console.log('Creating demonstration market');
                return createECPMarkets(dispatch).then((createdId) => {
                    console.log('Done creating');
                    pushMessage(TOUR_CHANNEL, { event: START_TOUR, tour: INVITE_STORIES_WORKSPACE_FIRST_VIEW });
                    const myChannel = new BroadcastChannel(MARKETS_CHANNEL);
                    return myChannel.postMessage(`/dialog/${createdId}`).then(() => myChannel.close())
                      .then(() => console.info('Redirect market context sent.'));
                  })
                  .catch((error) => {
                    console.error(error);
                    toastError('errorMarketFetchFailed');
                  });
              }
            });
          }
        }
      });
    return () => {};
  }, []);

  marketsContextHack = state;
  return (
    <MarketsContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketsContext.Provider>
  );
}

export { MarketsProvider, MarketsContext, MARKET_CONTEXT_NAMESPACE, MARKETS_CHANNEL, EMPTY_STATE };
