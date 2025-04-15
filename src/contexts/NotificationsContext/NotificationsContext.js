import React, { useEffect, useReducer, useState } from 'react'
import reducer, { initializeState, NOTIFICATIONS_CONTEXT_NAMESPACE, } from './notificationsContextReducer'
import beginListening from './notificationsContextMessages'
import LocalForageHelper from '../../utils/LocalForageHelper'

export const EMPTY_STATE = {
  messages: [],
  navigations: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);
const NOTIFICATIONS_CHANNEL = 'notifications';

function NotificationsProvider(props) {
  const { children } = props;
  const [initialized, setInitialized] = useState(undefined);
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

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
