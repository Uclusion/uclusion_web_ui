import React, { useState, useEffect } from 'react';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';


const LocaleContext = React.createContext([{}, () => {}]);

const LOCALE_CONTEXT_KEY = 'locale_context';

function LocaleProvider(props) {

  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(LOCALE_CONTEXT_KEY) || { locale: 'en' };
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    setUclusionLocalStorageItem(LOCALE_CONTEXT_KEY, state);
  }, [state]);

  return (
    <LocaleContext.Provider value={[state, setState]}>
      { children }
    </LocaleContext.Provider>
  );
}

export { LocaleContext, LocaleProvider };
