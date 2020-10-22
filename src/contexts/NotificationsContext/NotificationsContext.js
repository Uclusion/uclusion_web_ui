import React, { useEffect, useReducer, useState } from 'react'
import { useHistory } from 'react-router'
import reducer, { initializeState, NOTIFICATIONS_CONTEXT_NAMESPACE, } from './notificationsContextReducer'

import beginListening from './notificationsContextMessages'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { BroadcastChannel } from 'broadcast-channel'

export const EMPTY_STATE = {
  initializing: true,
  page: undefined,
  messages: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);

export const VISIT_CHANNEL = 'VisitChannel';
export const TOAST_CHANNEL = 'ToastChannel';
export const VIEW_EVENT = 'pageView';
const NOTIFICATIONS_CHANNEL = 'notifications';

function NotificationsProvider(props) {
  const { children } = props;
  const [, setChannel] = useState(undefined);
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const history = useHistory();

  useEffect(() => {
    const myChannel = new BroadcastChannel(NOTIFICATIONS_CHANNEL);
    myChannel.onmessage = () => {
      console.info('Reloading on notifications channel message');
      const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            const { messages, recent } = diskState;
            //We don't want to load up page or lastPage from disk
            dispatch(initializeState({ messages, recent }));
          }
        });
    }
    setChannel(myChannel);
    return () => {};
  }, []);

  useEffect(() => {
    console.info('Beginning listening in notifications provider');
    beginListening(dispatch, history);
    return () => {};
  }, [history]);

  useEffect(() => {
    const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          const { messages, recent } = state;
          //We don't want to load up page or lastPage from disk
          dispatch(initializeState({ messages, recent }));
        } else {
          dispatch(initializeState({
            page: undefined,
            messages: [],
          }));
        }
      });
    return () => {};
  }, []);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider, NOTIFICATIONS_CHANNEL };
