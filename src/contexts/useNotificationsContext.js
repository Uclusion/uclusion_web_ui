import { useContext } from 'react';
import { NotificationsContext } from './NotificationsContext';

function useNotificationsContext() {
  const [messages, isLoading] = useContext(NotificationsContext);
  // TODO need method here for returning the favicon dependent on if has messages and what color
  return {
    messages,
    isLoading,
  };
}

export default useNotificationsContext;
