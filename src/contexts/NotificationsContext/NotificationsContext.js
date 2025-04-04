import React, { useEffect, useReducer, useState } from 'react'
import reducer, { initializeState, NOTIFICATIONS_CONTEXT_NAMESPACE, } from './notificationsContextReducer'

import beginListening from './notificationsContextMessages'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'

export const EMPTY_STATE = {
  messages: [],
  navigations: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);
const NOTIFICATIONS_CHANNEL = 'notifications';

function NotificationsProvider(props) {
  const { children } = props;
  const [, setChannel] = useState(undefined);
  const [initialized, setInitialized] = useState(undefined);
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
    const myChannel = new BroadcastChannel(NOTIFICATIONS_CHANNEL);
    myChannel.onmessage = (msg) => {
      if (msg !== broadcastId) {
        console.info(`Reloading on notifications channel message ${msg} with ${broadcastId}`);
        const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
        lfg.getState()
          .then((diskState) => {
            if (diskState) {
              dispatch(initializeState(diskState));
            }
          });
      }
    }
    setChannel(myChannel);
    return () => {};
  }, []);

  useEffect(() => {
    console.info('Beginning listening in notifications provider');
    beginListening(dispatch, setInitialized);
    return () => {};
  }, []);

  useEffect(() => {
    const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          dispatch(initializeState(state));
        } else {
          dispatch(initializeState({
            page: undefined,
            messages: [],
            navigations: []
          }));
        }
      });
    return () => {};
  }, []);

  return (
    <NotificationsContext.Provider value={[state, dispatch, initialized, setInitialized]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider, NOTIFICATIONS_CHANNEL };
