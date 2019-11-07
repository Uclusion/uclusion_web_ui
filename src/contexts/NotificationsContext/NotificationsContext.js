import React, { useEffect, useState, useReducer } from 'react';
import reducer from './notificationsContextReducer';
import { deleteMessage } from '../../api/users';
import beginListening from './notificationsContextMessages';

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
      setIsInitialization(false);
      beginListening(dispatch);
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
      return marketId === messageMarketId && investibleId === messageInvestibleId
        && (level === 'YELLOW' || aType === 'INVESTIBLE_UNREAD');
    }).map((message) => deleteMessage(message));
  }

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
