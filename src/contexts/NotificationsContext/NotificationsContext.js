import React, { useEffect, useReducer, useState } from 'react'
import reducer, { initializeState, NOTIFICATIONS_CONTEXT_NAMESPACE, } from './notificationsContextReducer'
import beginListening from './notificationsContextMessages'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { notificationsDispatchHack } from './pendingClearsFlusher'

export const EMPTY_STATE = {
  messages: [],
  navigations: [],
  pendingClears: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);
const NOTIFICATIONS_CHANNEL = 'notifications';

function NotificationsProvider(props) {
  const { children } = props;
  const [initialized, setInitialized] = useState(undefined);
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
    console.info('Beginning listening in notifications provider');
    // B-all-544: the background clear flusher acks delivered clears through this dispatch
    notificationsDispatchHack.dispatch = dispatch;
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
            navigations: [],
            pendingClears: []
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
