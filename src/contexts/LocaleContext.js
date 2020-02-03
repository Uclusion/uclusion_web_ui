import React, { useState, useEffect } from 'react';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';
import { registerListener } from '../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from './WebSocketContext';


const LocaleContext = React.createContext([{}, () => {}]);

const LOCALE_CONTEXT_KEY = 'locale_context';

function LocaleProvider(props) {

  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(LOCALE_CONTEXT_KEY) || { locale: 'en' };
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    setUclusionLocalStorageItem(LOCALE_CONTEXT_KEY, state);
    registerListener(AUTH_HUB_CHANNEL, 'localeContext', (data) => {
      const { payload: { event, data: { username } } } = data;
      switch (event) {
        case 'signIn':
          const oldUserName = getUclusionLocalStorageItem('userName');
          if (oldUserName !== username) {
            setState(defaultValue)
          }
          break;
        case 'signOut':
          setState(defaultValue);
          break;
        default:
          console.debug(`Ignoring event ${event}`);
      }
    });
  }, [state, defaultValue]);

  return (
    <LocaleContext.Provider value={[state, setState]}>
      { children }
    </LocaleContext.Provider>
  );
}

export { LocaleContext, LocaleProvider };
