import React, {useState} from 'react';

const PageLoadingContext = React.createContext(false);

function PageLoadingProvider(props) {
  const { children } = props;
  const [state, setState] = useState(false);
  return (
    <PageLoadingContext.Provider value={[state, setState]}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export { PageLoadingContext, PageLoadingProvider };
