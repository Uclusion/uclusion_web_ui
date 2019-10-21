import React, { useEffect, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Hub } from '@aws-amplify/core';
import { getMessages } from '../api/sso';
import { AUTH_HUB_CHANNEL, MESSAGES_EVENT, NOTIFICATIONS_HUB_CHANNEL } from './WebSocketContext';
import { deleteMessage } from '../api/users';

const NotificationsContext = React.createContext([[], true]);

export const VISIT_CHANNEL = 'VisitChannel';
export const VIEW_EVENT = 'pageView';

function getMassagedMessages(messages) {
  return messages.map((message) => {
    const {
      type_object_id: typeObjectId,
      market_id_user_id: marketIdUserId,
      level,
    } = message;
    const objectId = typeObjectId.substring(typeObjectId.lastIndexOf('_') + 1);
    const aType = typeObjectId.substring(0, typeObjectId.lastIndexOf('_'));
    const marketIdUserIdSplit = marketIdUserId.split('_');
    const marketId = marketIdUserIdSplit[0];
    if (marketId === objectId) {
      return {
        ...message, marketId, aType, level,
      };
    }
    return {
      ...message, marketId, aType, level, investibleId: objectId,
    };
  });
}

function NotificationsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialization, setIsInitialization] = useState(true);
  const [page, setPage] = useState(undefined);

  useEffect(() => {
    if (isInitialization) {
      Hub.listen(AUTH_HUB_CHANNEL, (data) => {
        const { payload: { event } } = data;
        console.debug(`Notifications context responding to auth event ${event}`);

        switch (event) {
          case 'signIn':
            getMessages().then((messages) => {
              setMessages(getMassagedMessages(messages));
              setIsLoading(false);
            });
            break;
          case 'signOut':
            break;
          default:
            console.debug(`Ignoring auth event ${event}`);
        }
      });

      Hub.listen(NOTIFICATIONS_HUB_CHANNEL, (data) => {
        const { payload: { event } } = data;
        console.debug(`Notifications context responding to push event ${event}`);

        switch (event) {
          case MESSAGES_EVENT:
            setIsLoading(true);
            getMessages().then((messages) => {
              setMessages(getMassagedMessages(messages));
              setIsLoading(false);
            });
            break;
          default:
            console.debug(`Ignoring push event ${event}`);
        }
      });

      Hub.listen(VISIT_CHANNEL, (data) => {
        const { payload: { event, message } } = data;
        switch (event) {
          case VIEW_EVENT: {
            const { marketId, investibleIdOrContext, isEntry } = message;
            console.debug('Received:');
            console.debug(message);
            if (isEntry) {
              if (investibleIdOrContext === 'context') {
                setPage({ marketId });
              } else {
                setPage({ marketId, investibleId: investibleIdOrContext });
              }
            } else {
              setPage(undefined);
            }
            break;
          }
          default:
            console.debug(`Ignoring event ${event}`);
        }
      });

      getMessages().then((messages) => {
        setMessages(getMassagedMessages(messages));
        setIsLoading(false);
        setIsInitialization(false);
      });
    }
    return () => {
    };
  }, [isInitialization]);

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
    <NotificationsContext.Provider value={[messages, isLoading]}>
      { children }
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
