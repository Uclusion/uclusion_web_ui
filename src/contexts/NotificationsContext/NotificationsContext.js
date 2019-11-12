import React, { useEffect, useState, useReducer } from 'react';
import reducer, {
  initializeState,
  NOTIFICATIONS_CONTEXT_NAMESPACE,
  removeMessage,
} from './notificationsContextReducer';
import { deleteMessage } from '../../api/users';
import beginListening from './notificationsContextMessages';
import LocalForageHelper from '../LocalForageHelper';

const EMPTY_STATE = {
  messages: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);

export const VISIT_CHANNEL = 'VisitChannel';
export const VIEW_EVENT = 'pageView';

function NotificationsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  useEffect(() => {
    if (isInitialization) {
      const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            dispatch(initializeState(state));
          }
        });
      beginListening(dispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization]);

  const { page, messages } = state;
  if (page) {
    messages.filter((message) => {
      const { marketId, investibleId } = page;
      const {
        marketId: messageMarketId, investibleId: messageInvestibleId,
        level, aType,
      } = message;
      const doRemove = marketId === messageMarketId && investibleId === messageInvestibleId
        && (level === 'YELLOW' || aType === 'UNREAD' || aType === 'INVESTIBLE_SUBMITTED');
      if (doRemove) {
        dispatch(removeMessage(message));
      }
      return doRemove;
    }).map((message) => deleteMessage(message));
  }

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
