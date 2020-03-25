import React, { useEffect, useState } from 'react';
import * as JsSearch from 'js-search';
import { beginListening } from './searchIndexContextMessages';
const EMPTY_STATE = null;

const SearchIndexContext = React.createContext(EMPTY_STATE);

function SearchIndexProvider(props) {
  const [state, setState] = useState(EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  useEffect(() => {
    if (isInitialization) {
      const index = new JsSearch.Search('id');
      index.indexStrategy = new JsSearch.AllSubstringsIndexStrategy();
      index.addIndex('body');
      setState(index);
      beginListening(index);
      setIsInitialization(false);
    }
    return () => {};
  }, [isInitialization, state]);

  return (
    <SearchIndexContext.Provider value={[state]} >
      {props.children}
    </SearchIndexContext.Provider>
  );
}

export { SearchIndexProvider, SearchIndexContext };
