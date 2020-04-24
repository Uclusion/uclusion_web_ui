import React, { useEffect, useReducer, useState } from 'react'
import { useHistory } from 'react-router'
import reducer, {
  initializeState,
  NOTIFICATIONS_CONTEXT_NAMESPACE,
} from './notificationsContextReducer'

import beginListening from './notificationsContextMessages'
import LocalForageHelper from '../../utils/LocalForageHelper'

export const EMPTY_STATE = {
  initializing: true,
  page: undefined,
  messages: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);

export const VISIT_CHANNEL = 'VisitChannel';
export const TOAST_CHANNEL = 'ToastChannel';
export const VIEW_EVENT = 'pageView';
export const NAVIGATION_CHANNEL = 'VisitChannel'

function NotificationsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  const history = useHistory();

  useEffect(() => {
    if (isInitialization) {
      const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            const { messages } = state;
            //We don't want to load up page or lastPage from disk
            dispatch(initializeState({ messages }));
          }
        });
      beginListening(dispatch, history);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization, history]);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
