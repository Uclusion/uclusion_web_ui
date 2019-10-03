import React, { useEffect, useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Hub } from '@aws-amplify/core';
import { getMessages } from '../api/sso';
import { AUTH_HUB_CHANNEL, MESSAGES_EVENT, PUSH_HUB_CHANNEL } from './WebSocketContext';

const NotificationsContext = React.createContext([[], true]);

function NotificationsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    if (isInitialization) {
      getMessages().then((messages) => {
        setMessages(messages);
        setIsLoading(false);
        setIsInitialization(false);
      });
    }
    return () => {
    };
  });

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
          setMessages(messages);
          setIsLoading(false);
        });
        break;
      default:
        console.debug(`Ignoring push event ${event}`);
    }
  });

  return (
    <NotificationsContext.Provider value={[messages, isLoading]}>
      { children }
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
