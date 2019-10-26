import React, { useEffect, useState, useReducer } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import reducer, { updateMessages } from './notificationsContextReducer';
import { getMessages } from '../../api/sso';

import { deleteMessage } from '../../api/users';
import beginListening from './notificationsContextMessages';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/utils';

const EMPTY_STATE = {
  messages: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);

const NOTIFICATIONS_CONTEXT_NAMESPACE = 'notifications_context';
export const VISIT_CHANNEL = 'VisitChannel';
export const VIEW_EVENT = 'pageView';

function NotificationsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  // we'll also want to re-initialize if we've cleared local data as we'll reload the markets then
  const haveLocalData = getUclusionLocalStorageItem(NOTIFICATIONS_CONTEXT_NAMESPACE);
  useEffect(() => {
    if (isInitialization || !haveLocalData) {
      getMessages().then((messages) => {
        dispatch(updateMessages(messages));
        setIsInitialization(false);
      });
      beginListening(dispatch);
      setUclusionLocalStorageItem(NOTIFICATIONS_CONTEXT_NAMESPACE, true);
    }
    return () => {
    };
  }, [isInitialization, haveLocalData]);

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
