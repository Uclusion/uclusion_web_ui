import React, { useEffect, useState } from 'react'
import MiniSearch from 'minisearch'
import { beginListening } from './searchIndexContextMessages'

const EMPTY_STATE = null;

const SearchIndexContext = React.createContext(EMPTY_STATE);

function SearchIndexProvider(props) {
  const [state, setState] = useState(EMPTY_STATE);

  useEffect(() => {
    // See https://github.com/lucaong/minisearch/issues/225 - will not do middle of word search to keep space small
    const index = new MiniSearch({
      fields: ['title', 'body'],
      storeFields: ['marketId', 'groupId', 'type'],
      searchOptions: {
        boost: { title: 2 },
        fuzzy: 1,
        prefix: true
      }
    });
    setState(index);
    beginListening(index);
    return () => {};
  }, []);

  return (
    <SearchIndexContext.Provider value={[state]} >
      {props.children}
    </SearchIndexContext.Provider>
  );
}

export { SearchIndexProvider, SearchIndexContext };
