import React, { useCallback, useEffect, useReducer, useState } from 'react'
import reducer, { initializeState, NOTIFICATIONS_CONTEXT_NAMESPACE, } from './notificationsContextReducer'
import beginListening from './notificationsContextMessages'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { flushSync } from 'react-dom';
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

  const hydrateNotificationsFromDisk = useCallback(() => {
    const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
    return lfg.getStoredState().then((diskState) => {
      const hydratedState = diskState || {
        page: undefined,
        messages: [],
        navigations: [],
        pendingClears: []
      };
      flushSync(() => {
        dispatch(initializeState(hydratedState));
        setInitialized(true);
      });
      return hydratedState;
    });
  }, []);

  useEffect(() => {
    console.info('Beginning listening in notifications provider');
    // B-all-544: the background clear flusher acks delivered clears through this dispatch
    notificationsDispatchHack.dispatch = dispatch;
    beginListening(dispatch, setInitialized);
    return () => {};
  }, []);

  useEffect(() => {
    hydrateNotificationsFromDisk()
      .catch((error) => console.warn('Unable to load notifications from disk', error));
    return () => {};
  }, [hydrateNotificationsFromDisk]);

  return (
    <NotificationsContext.Provider value={[
      state, dispatch, initialized, setInitialized, hydrateNotificationsFromDisk
    ]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider, NOTIFICATIONS_CHANNEL };
