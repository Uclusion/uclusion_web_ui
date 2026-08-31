import React, { useEffect, useState } from 'react'
import MiniSearch from 'minisearch'
import { beginListening } from './searchIndexContextMessages'

const EMPTY_STATE = null;
const SEARCH_INDEX_AUTO_VACUUM = { batchSize: Number.MAX_SAFE_INTEGER };

const SearchIndexContext = React.createContext(EMPTY_STATE);

function SearchIndexProvider(props) {
  const [state, setState] = useState(EMPTY_STATE);

  useEffect(() => {
    // See https://github.com/lucaong/minisearch/issues/225 - will not do middle of word search to keep space small
    const index = new MiniSearch({
      fields: ['title', 'body'],
      storeFields: ['marketId', 'groupId', 'type'],
      // MiniSearch's batched vacuum can race a search that cleans the same
      // radix tree (upstream issue #306). Finish traversal in the current task
      // so searches cannot invalidate its iterator between batches.
      autoVacuum: SEARCH_INDEX_AUTO_VACUUM,
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

export { SearchIndexProvider, SearchIndexContext, SEARCH_INDEX_AUTO_VACUUM };
