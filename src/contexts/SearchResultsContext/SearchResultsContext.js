import React, { useState } from 'react';
const EMPTY_STATE = {
  search: '',
  results: [],
};

const SearchResultsContext = React.createContext(EMPTY_STATE);

function SearchResultsProvider(props) {
  const [state, setState] = useState(EMPTY_STATE);
  return (
    <SearchResultsContext.Provider value={[state, setState]} >
      {props.children}
    </SearchResultsContext.Provider>
  );
}

export { SearchResultsProvider, SearchResultsContext };
