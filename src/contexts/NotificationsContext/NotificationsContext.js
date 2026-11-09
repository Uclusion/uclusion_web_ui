import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
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
export const NotificationsRefreshContext = React.createContext({
  refreshed: false, refreshing: false, refreshError: false
});
const NOTIFICATIONS_CHANNEL = 'notifications';

function NotificationsProvider(props) {
  const { children } = props;
  const [initialized, setInitialized] = useState(undefined);
  const [refreshState, setRefreshState] = useState({ refreshed: false, refreshing: false, refreshError: false });
  const networkGeneration = useRef(0);
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  const hydrateNotificationsFromDisk = useCallback(() => {
    const generation = networkGeneration.current;
    const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
    return lfg.getStoredState().then((diskState) => {
      const hydratedState = diskState || {
        page: undefined,
        messages: [],
        navigations: [],
        pendingClears: []
      };
      // A slower disk read must not replace the server snapshot that arrived while it ran.
      if (generation !== networkGeneration.current) {
        return hydratedState;
      }
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
    beginListening(dispatch, (status) => {
      if (status.refreshed) {
        networkGeneration.current += 1;
        setInitialized(true);
      }
      setRefreshState((current) => Object.entries(status).every(([key, value]) => current[key] === value)
        ? current : { ...current, ...status });
    });
    return () => {};
  }, []);

  useEffect(() => {
    hydrateNotificationsFromDisk()
      .catch((error) => console.warn('Unable to load notifications from disk', error));
    return () => {};
  }, [hydrateNotificationsFromDisk]);

  // Status changes must not invalidate every message consumer when the message list is unchanged.
  const contextValue = useMemo(() => [state, dispatch, initialized, setInitialized, hydrateNotificationsFromDisk],
    [state, initialized, hydrateNotificationsFromDisk]);

  return (
    <NotificationsContext.Provider value={contextValue}>
      <NotificationsRefreshContext.Provider value={refreshState}>
        {children}
      </NotificationsRefreshContext.Provider>
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider, NOTIFICATIONS_CHANNEL };
