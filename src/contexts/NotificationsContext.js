import React, { useEffect, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Hub } from '@aws-amplify/core';
import { getMessages } from '../api/sso';
import { AUTH_HUB_CHANNEL, MESSAGES_EVENT, PUSH_HUB_CHANNEL } from './WebSocketContext';

const NotificationsContext = React.createContext([[], true]);

export const VISIT_CHANNEL = 'VisitChannel';
export const VIEW_EVENT = 'pageView';
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
              setMessages(messages);
              setIsLoading(false);
            });
            break;
          case 'signOut':
            break;
          default:
            console.debug(`Ignoring auth event ${event}`);
        }
      });

      Hub.listen(PUSH_HUB_CHANNEL, (data) => {
        const { payload: { event } } = data;
        console.debug(`Notifications context responding to push event ${event}`);

        switch (event) {
          case MESSAGES_EVENT:
            setIsLoading(true);
            getMessages().then((messages) => {
              // TODO if any of these messages are about unread on a page currently on then delete
              setMessages(messages);
              setIsLoading(false);
            });
            break;
          default:
            console.debug(`Ignoring push event ${event}`);
        }
      });

      // TODO Notifications context should put messages on bus for other contexts
      //  update_at that they should be greater than or equal to or else refresh
      // TODO for comments put comment ID and updated_at - then go find that comment ID and
      // TODO check its updated_at >= - if not refresh

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
        setMessages(messages);
        setIsLoading(false);
        setIsInitialization(false);
      });
    }
    return () => {
    };
  }, [isInitialization]);

  return (
    <NotificationsContext.Provider value={[messages, isLoading]}>
      { children }
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
