import React, { useEffect, useReducer, useState } from 'react'
import beginListening from './marketsContextMessages'
import reducer, { initializeState } from './marketsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import localforage from 'localforage'
import { TOKEN_STORAGE_KEYSPACE } from '../../api/tokenConstants';

const MARKET_CONTEXT_NAMESPACE = 'market_context';
const EMPTY_STATE = {
  initializing: true,
  marketDetails: [],
};
const MARKETS_CHANNEL = 'markets';
const MarketsContext = React.createContext(EMPTY_STATE);

// normally this would be in context hacks directory but we can use this let to get the context out of the react tree
// we don't use a provider, because we have one defined below
let marketsContextHack;
let tokensHashHack; //Load here so no access without being loaded first - but page also has guards for invite etc.
export { marketsContextHack, tokensHashHack };

function MarketsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, setChannel] = useState(undefined);
  const [tokensHash, setTokensHash] = useState({});

  useEffect(() => {
    const myChannel = new BroadcastChannel(MARKETS_CHANNEL);
    myChannel.onmessage = (msg) => {
      if (msg !== broadcastId) {
        console.info(`Reloading on markets channel message ${msg} with ${broadcastId}`);
        const store = localforage.createInstance({ storeName: TOKEN_STORAGE_KEYSPACE });
        const localTokenHash = {};
        store.iterate((value, key) => {
          localTokenHash[key] = value;
        }).then(() => {
          setTokensHash(localTokenHash);
          const lfg = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
          return lfg.getState().then((diskState) => {
            if (diskState) {
              dispatch(initializeState(diskState));
            }
          });
        });
      }
    }
    setChannel(myChannel);
    return () => {};
  }, []);

  useEffect(() => {
    beginListening(dispatch, setTokensHash);
    return () => {};
  }, []);

  useEffect(() => {
    // load market tokens for use by Quill img url re-writing
    const store = localforage.createInstance({ storeName: TOKEN_STORAGE_KEYSPACE });
    const localTokenHash = {};
    store.iterate((value, key) => {
      localTokenHash[key] = value;
    }).then(() => {
      setTokensHash(localTokenHash);
      // load state from storage
      const lfg = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
      return lfg.getState().then((diskState) => {
        if (diskState) {
          dispatch(initializeState(diskState));
        } else {
          dispatch(initializeState({
            marketDetails: [],
          }));
        }
      });
    });
    return () => {};
  }, []);
  tokensHashHack = tokensHash;
  marketsContextHack = state;
  return (
    <MarketsContext.Provider value={[state, dispatch, tokensHash]}>
      {props.children}
    </MarketsContext.Provider>
  );
}

export { MarketsProvider, MarketsContext, MARKET_CONTEXT_NAMESPACE, MARKETS_CHANNEL, EMPTY_STATE };
